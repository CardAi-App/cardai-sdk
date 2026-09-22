'use client';

import { useCallback, useRef, useState } from 'react';
import { addToCardAi } from '../core.js';
import type { AddOptions, AddOutcome } from '../types.js';

export interface UseAddToCardAi extends AddOptions {
  onDone?: (outcome: AddOutcome) => void;
}

export interface AddState {
  /** Chame no onClick. Não precisa de await. */
  add: () => void;
  busy: boolean;
  /** Terminou com sucesso. */
  added: boolean;
  /** Deck onde os flashcards caíram, quando a pessoa termina. */
  deckId: string | null;
  error: string | null;
  /** Volta ao estado inicial, para um botão que some depois de um tempo. */
  reset: () => void;
}

/**
 * O comportamento do botão, sem nenhuma decisão de aparência.
 *
 *     const { add, busy, added } = useAddToCardAi({ deckName: 'Mitose', text });
 *     <MeuBotao onClick={add} disabled={busy}>
 *       {added ? 'Abrir deck' : 'Salvar no Card.Ai'}
 *     </MeuBotao>
 */
export function useAddToCardAi(options: UseAddToCardAi = {}): AddState {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // As opções mudam a cada render; o handler não pode mudar junto, senão
  // quebra a memo de quem recebe `add` como prop.
  const latest = useRef(options);
  latest.current = options;

  const add = useCallback(() => {
    setError(null);
    setBusy(true);
    // Sem await antes do addToCardAi: o popup tem que nascer dentro do gesto.
    addToCardAi(latest.current)
      .then(({ done }) =>
        done.then((outcome) => {
          setBusy(false);
          if (outcome.status === 'success') {
            setAdded(true);
            setDeckId(outcome.deckId ?? null);
          }
          latest.current.onDone?.(outcome);
        }),
      )
      .catch((err: unknown) => {
        setBusy(false);
        setError(err instanceof Error ? err.message : 'Não foi possível adicionar.');
      });
  }, []);

  const reset = useCallback(() => {
    setBusy(false);
    setAdded(false);
    setDeckId(null);
    setError(null);
  }, []);

  return { add, busy, added, deckId, error, reset };
}
