'use client';

import type { CSSProperties } from 'react';
import { useAddToCardAi, type UseAddToCardAi } from './useAddToCardAi.js';

const MARK = 'https://cardai.app/cardai-icon.png';

export interface CardAiButtonProps extends UseAddToCardAi {
  /** Vazio = só a marca. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  theme?: 'light' | 'dark' | 'auto';
  /** Suas classes. Vão no botão, junto com as nossas. */
  className?: string;
  /** Sem as nossas classes: a aparência é inteiramente sua. */
  unstyled?: boolean;
  style?: CSSProperties;
}

/**
 * O botão pronto. Precisa do CSS:
 *
 *     import '@cardai/sdk/styles.css';
 *
 * Para um botão seu, use `useAddToCardAi` e não importe nada disto.
 */
export function CardAiButton({
  label = 'Adicionar ao Card.Ai',
  size = 'md',
  variant = 'solid',
  theme = 'light',
  className = '',
  unstyled = false,
  style,
  ...options
}: CardAiButtonProps) {
  const { add, busy, added, deckId, error } = useAddToCardAi(options);
  const shown = added ? 'Abrir deck' : label;

  return (
    <span className="cardai-root">
      <button
        type="button"
        onClick={added && deckId ? () => location.assign(`https://cardai.app/flashcard/${deckId}`) : add}
        disabled={busy}
        aria-label={shown || 'Adicionar ao Card.Ai'}
        className={[unstyled ? '' : 'cardai-btn', className].filter(Boolean).join(' ')}
        style={style}
        data-size={unstyled ? undefined : size}
        data-variant={unstyled ? undefined : variant}
        data-theme={unstyled ? undefined : theme}
        data-cardai-state={added ? 'done' : busy ? 'busy' : undefined}
        data-icon-only={!unstyled && !shown ? '' : undefined}
      >
        <span className="cardai-disc">
          {busy ? (
            <span className="cardai-spinner" />
          ) : added ? (
            <svg className="cardai-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <img className="cardai-mark" src={MARK} alt="" />
          )}
        </span>
        {shown ? <span className="cardai-label">{shown}</span> : null}
      </button>
      {error ? (
        <span className="cardai-note" data-tone="error">
          {error}
        </span>
      ) : null}
    </span>
  );
}
