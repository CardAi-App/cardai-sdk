import type { AddOptions, AddOutcome, AddResult } from './types.js';

const API = 'https://api.cardai.app';
const APP = 'https://cardai.app';
const POPUP = 'popup,width=440,height=720';

const trim = (url: string) => url.replace(/\/$/, '');

function body(options: AddOptions) {
  const mode = options.mode ?? 'cards';
  const payload: Record<string, unknown> = {
    mode,
    deck_name: options.deckName ?? 'Flashcards',
    source_name: typeof location === 'undefined' ? '' : location.hostname,
    actions: options.actions ?? 'create',
  };
  if (mode === 'prompt') {
    payload.prompt = options.prompt ?? '';
    payload.source_text = options.sourceText ?? '';
  } else if (options.text?.trim()) {
    // Quem separa `pergunta :: resposta` é o servidor: um parser só, para as
    // regras não divergirem entre as linguagens que consomem isto.
    payload.text = options.text;
  } else {
    payload.cards = (options.cards ?? []).map((card) => {
      const item = card as Record<string, unknown>;
      const out: Record<string, unknown> = { ...item };
      // camelCase na API do pacote, snake_case no wire.
      for (const [from, to] of [
        ['questionImageUrl', 'question_image_url'],
        ['answerImageUrl', 'answer_image_url'],
        ['headerRow', 'header_row'],
      ] as const) {
        if (from in out) {
          out[to] = out[from];
          delete out[from];
        }
      }
      return out;
    });
  }
  return payload;
}

/** Escuta a janela do Card.Ai. Resolve também quando ela é só fechada, para
 *  nenhuma promessa ficar pendurada se a pessoa desistir. */
function watch(popup: Window | null, appOrigin: string): Promise<AddOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: AddOutcome) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      window.clearInterval(timer);
      resolve(outcome);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== appOrigin) return;
      const data = event.data as { type?: string; status?: string; deckId?: string } | null;
      if (data?.type !== 'cardai:add') return;
      finish({ status: data.status === 'success' ? 'success' : 'error', deckId: data.deckId });
    };
    window.addEventListener('message', onMessage);
    const timer = window.setInterval(() => {
      if (popup?.closed) finish({ status: 'closed' });
    }, 500);
  });
}

/**
 * Manda flashcards para a conta de quem clicou.
 *
 * Chame direto no handler do clique. A janela abre na primeira linha, antes de
 * qualquer `await`, porque navegador só permite abrir dentro do gesto — um
 * `await` antes disto faz o popup ser bloqueado.
 *
 *     <button onClick={() => addToCardAi({ deckName: 'Mitose', text })}>
 */
export async function addToCardAi(options: AddOptions = {}): Promise<AddResult> {
  const api = trim(options.apiUrl ?? API);
  const app = trim(options.appUrl ?? APP);
  const popup = window.open(`${app}/add/opening?r=${Date.now()}`, 'cardai-add', POPUP);
  const done = watch(popup, new URL(app).origin);

  try {
    const payload = body(options);
    if (options.src && !payload.text && !(payload.cards as unknown[])?.length) {
      const file = await fetch(new URL(options.src, location.href).href, { credentials: 'same-origin' });
      if (!file.ok) throw new Error(`Não foi possível ler ${options.src}`);
      payload.cards = await file.json();
    }

    const response = await fetch(`${api}/public/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.detail?.message ?? detail?.detail ?? 'Falha ao preparar o envio');
    }

    const { id } = (await response.json()) as { id: string };
    const url = `${app}/add/${id}`;
    if (popup && !popup.closed) {
      popup.location.replace(url);
    } else {
      // Popup bloqueado (navegador dentro de app, por exemplo): a própria aba vai.
      location.assign(url);
    }
    return { id, done };
  } catch (error) {
    popup?.close();
    throw error;
  }
}
