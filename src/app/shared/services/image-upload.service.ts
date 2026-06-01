import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, map, Observable, throwError } from 'rxjs';

import { SUPABASE_ANON_KEY, SUPABASE_BUCKET, SUPABASE_URL } from '../config/supabase.config';

type CarpetaImagen = 'chat' | 'perfiles' | 'servicios';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private supabase: SupabaseClient | null = null;

  // Indica si el frontend tiene credenciales para usar Supabase Storage.
  estaConfigurado(): boolean {
    return Boolean(this.supabase);
  }

  // Sube una imagen al bucket compartido y devuelve la URL pública final.
  subirImagen(file: File, carpeta: CarpetaImagen): Observable<string> {
    const supabase = this.obtenerCliente();

    if (!supabase) {
      return throwError(() => new Error('Supabase no está configurado en el frontend.'));
    }

    const nombreArchivo = this.generarNombreArchivo(file.name);
    const ruta = `${carpeta}/${Date.now()}-${nombreArchivo}`;

    return from(
      supabase.storage.from(SUPABASE_BUCKET).upload(ruta, file, {
        contentType: file.type,
        upsert: false,
      })
    ).pipe(
      map((resultado) => {
        if (resultado.error) {
          throw new Error(this.formatearErrorSupabase(resultado.error));
        }

        const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(ruta);

        if (!data.publicUrl) {
          throw new Error('No se pudo obtener la URL pública de la imagen.');
        }

        return data.publicUrl;
      })
    );
  }

  // Devuelve el cliente de Supabase solo si la URL y la clave son válidas.
  private obtenerCliente(): SupabaseClient | null {
    if (this.supabase) {
      return this.supabase;
    }

    if (!this.esConfiguracionValida(SUPABASE_URL, SUPABASE_ANON_KEY)) {
      return null;
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return this.supabase;
  }

  // Comprueba que la URL tenga formato válido y que la clave no esté vacía.
  private esConfiguracionValida(url: string, anonKey: string): boolean {
    if (!url.trim() || !anonKey.trim()) {
      return false;
    }

    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
    } catch {
      return false;
    }
  }

  // Normaliza el nombre del archivo para que sea seguro en el bucket.
  private generarNombreArchivo(nombreOriginal: string): string {
    const nombre = nombreOriginal
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return nombre || 'imagen.png';
  }

  // Convierte errores de Supabase en mensajes más útiles para el usuario.
  private formatearErrorSupabase(error: unknown): string {
    const mensaje =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message ?? '')
        : String(error ?? '');

    if (mensaje.toLowerCase().includes('row-level security') || mensaje.toLowerCase().includes('rls')) {
      return 'Supabase bloqueó la subida por una policy de Storage. Falta permitir INSERT en storage.objects para este bucket.';
    }

    if (mensaje.toLowerCase().includes('invalid compact jws') || mensaje.toLowerCase().includes('invalid api key')) {
      return 'Supabase rechazó la clave. Revisa que la anon public key esté bien copiada.';
    }

    if (mensaje.toLowerCase().includes('bucket') && mensaje.toLowerCase().includes('not found')) {
      return `No existe el bucket "${SUPABASE_BUCKET}" en Supabase.`;
    }

    return mensaje || 'No se pudo subir la imagen.';
  }
}
