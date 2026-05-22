import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'chat-composer',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './chat-composer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComposerComponent {
  readonly submitted = output<string>();
  readonly message = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  submit(): void {
    const value = this.message.value.trim();

    if (!value) {
      this.message.markAsTouched();
      return;
    }

    this.submitted.emit(value);
    this.message.setValue('');
  }
}
