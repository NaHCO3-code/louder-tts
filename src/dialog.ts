const errorDialogEl = document.getElementById('error-dialog') as HTMLDialogElement;
const errorinfoEl = document.getElementById('error-info') as HTMLParagraphElement;
const closeBtn = document.getElementById('close-error') as HTMLButtonElement;

closeBtn.addEventListener('click', () => {
  errorDialogEl.close();
});

export function showErrorDialog(message: string) {
  errorinfoEl.innerHTML = message;
  errorDialogEl.showModal();
}