import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

const setup = (onClose = vi.fn()) => {
  render(
    <Modal onClose={onClose} labelledBy="dlg-title">
      <h2 id="dlg-title">Apply for Developer</h2>
      <button type="button">Inside</button>
    </Modal>,
  );
  return { onClose, dialog: screen.getByRole('dialog', { name: 'Apply for Developer' }) };
};

describe('Modal', () => {
  it('is a modal dialog named by its heading', () => {
    const { dialog } = setup();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus into the dialog when it opens', () => {
    const { dialog } = setup();
    expect(dialog).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const { onClose } = setup();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked, but not when the panel is', async () => {
    const { onClose, dialog } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Inside' }));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('gives focus back to whatever opened it', async () => {
    const Page = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {open && (
            <Modal onClose={() => setOpen(false)} labelledBy="t">
              <h2 id="t">Title</h2>
            </Modal>
          )}
        </>
      );
    };
    render(<Page />);

    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Title' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
