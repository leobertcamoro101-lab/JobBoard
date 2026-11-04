import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import FilePicker from './FilePicker';

const EXT = ['.pdf', '.docx'];
const LIMIT = 900 * 1024;

// applyAccept: false lets the tests pick files the input's `accept` list would filter out,
// so the component's own check is what gets exercised.
const user = userEvent.setup({ applyAccept: false });

const setup = (props: Partial<React.ComponentProps<typeof FilePicker>> = {}) => {
  const onPick = vi.fn();
  render(<FilePicker accept={EXT} maxBytes={LIMIT} label="Select resume" icon={FileText} onPick={onPick} {...props} />);
  return { onPick, input: screen.getByLabelText('Select resume') };
};

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe('FilePicker', () => {
  it('is a file input named by its button text, limited to the allowed extensions', () => {
    const { input } = setup();
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', '.pdf,.docx');
  });

  it('can be reached with the keyboard', async () => {
    const { input } = setup();
    await user.tab();
    expect(input).toHaveFocus();
  });

  it('hands over a valid file with no error', async () => {
    const { onPick, input } = setup();
    const cv = file('cv.pdf');
    await user.upload(input, cv);
    expect(onPick).toHaveBeenCalledWith(cv, '');
  });

  it('ignores the extension’s case', async () => {
    const { onPick, input } = setup();
    await user.upload(input, file('CV.PDF'));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'CV.PDF' }), '');
  });

  it('rejects the wrong type with a message and no file', async () => {
    const { onPick, input } = setup();
    await user.upload(input, file('photo.png'));
    expect(onPick).toHaveBeenCalledWith(null, 'Only .pdf, .docx files are allowed');
  });

  it('uses a custom wrong-type message when given one', async () => {
    const { onPick, input } = setup({ typeMessage: 'Please choose a PDF or Word file' });
    await user.upload(input, file('photo.png'));
    expect(onPick).toHaveBeenCalledWith(null, 'Please choose a PDF or Word file');
  });

  it('rejects a file over the limit, but accepts one exactly at it', async () => {
    const { onPick, input } = setup();
    await user.upload(input, file('big.pdf', LIMIT + 1));
    expect(onPick).toHaveBeenLastCalledWith(null, 'File must be less than 900kb');

    const exact = file('ok.pdf', LIMIT);
    await user.upload(input, exact);
    expect(onPick).toHaveBeenLastCalledWith(exact, '');
  });

  it('does nothing when the dialog is cancelled with no file', async () => {
    const { onPick, input } = setup();
    await user.upload(input, []);
    expect(onPick).not.toHaveBeenCalled();
  });

  it('lets the same file be chosen again after it was rejected', async () => {
    const { onPick, input } = setup();
    const bad = file('photo.png');
    await user.upload(input, bad);
    await user.upload(input, bad);
    expect(onPick).toHaveBeenCalledTimes(2);
  });
});
