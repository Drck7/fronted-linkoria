import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'chat-composer',
  imports: [ReactiveFormsModule],
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