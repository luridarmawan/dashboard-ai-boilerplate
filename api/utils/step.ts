/**
 * USAGE:
 * const step = new Step();
 * step.start('Loading...');
 * step.update('Loading...');
 * step.stop('Loaded!');
 */

import ora, { Ora } from 'ora';

class Step {
  private spinner?: Ora;

  start(text: string): void {
    this.spinner = ora({
      spinner: 'dots2',
      text: text
    }).start();
  }

  update(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  info(text: string): void {
    if (this.spinner) {
      this.spinner.info(text);
    }
  }

  stop(text: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
    }
  }
}

export default Step;
