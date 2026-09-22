import { afterEach, describe, expect, it, vi } from 'vitest';
import { addToCardAi } from '../src/core.js';

function stub({ ok = true, id = 'abc123' } = {}) {
  const popup = { closed: false, close: vi.fn(), location: { replace: vi.fn() } };
  vi.stubGlobal('window', {
    open: vi.fn(() => popup),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setInterval: vi.fn(() => 1),
    clearInterval: vi.fn(),
  });
  vi.stubGlobal('location', { hostname: 'parceiro.com', href: 'https://parceiro.com/aula', assign: vi.fn() });
  const fetchSpy = vi.fn(async () => ({
    ok,
    json: async () => (ok ? { id } : { detail: 'Envie ao menos um flashcard.' }),
  }));
  vi.stubGlobal('fetch', fetchSpy);
  return { popup, fetchSpy };
}

const sent = (fetchSpy: ReturnType<typeof vi.fn>) => {
  const call = fetchSpy.mock.calls[0];
  if (!call) throw new Error('nenhum POST foi feito');
  return JSON.parse(call[1].body);
};

afterEach(() => vi.unstubAllGlobals());

describe('addToCardAi', () => {
  it('abre a janela antes de qualquer await, senão o navegador bloqueia', () => {
    const { popup } = stub();
    void addToCardAi({ text: 'Q :: A' });
    // Sem await nenhum: a janela já tem que existir.
    expect(window.open).toHaveBeenCalledOnce();
    expect(popup.location.replace).not.toHaveBeenCalled();
  });

  it('manda o texto cru e deixa o servidor separar', async () => {
    const { fetchSpy } = stub();
    await addToCardAi({ deckName: 'Mitose', text: 'O que é mitose? :: Divisão celular.' });
    const body = sent(fetchSpy);
    expect(body.text).toBe('O que é mitose? :: Divisão celular.');
    expect(body.deck_name).toBe('Mitose');
    expect(body.cards).toBeUndefined();
  });

  it('traduz camelCase para o formato do wire', async () => {
    const { fetchSpy } = stub();
    await addToCardAi({
      cards: [
        { question: 'Q', answer: 'A', answerImageUrl: 'https://x/y.png' },
        { type: 'TableOcclusion', question: 'T', rows: [[{ text: 'a' }]], headerRow: true },
      ],
    });
    const [plain, table] = sent(fetchSpy).cards;
    expect(plain.answer_image_url).toBe('https://x/y.png');
    expect(plain.answerImageUrl).toBeUndefined();
    expect(table.header_row).toBe(true);
  });

  it('o domínio do parceiro vira a origem, não um texto que ele escolhe', async () => {
    const { fetchSpy } = stub();
    await addToCardAi({ text: 'Q :: A' });
    expect(sent(fetchSpy).source_name).toBe('parceiro.com');
  });

  it('leva a janela para o rascunho criado', async () => {
    const { popup } = stub({ id: 'rascunho42' });
    await addToCardAi({ text: 'Q :: A' });
    expect(popup.location.replace).toHaveBeenCalledWith('https://cardai.app/add/rascunho42');
  });

  it('fecha a janela e propaga o erro quando o servidor recusa', async () => {
    const { popup } = stub({ ok: false });
    await expect(addToCardAi({ cards: [] })).rejects.toThrow('Envie ao menos um flashcard.');
    expect(popup.close).toHaveBeenCalled();
  });

  it('cai para a própria aba quando o popup foi bloqueado', async () => {
    stub();
    (window.open as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
    await addToCardAi({ text: 'Q :: A' });
    expect(location.assign).toHaveBeenCalledWith('https://cardai.app/add/abc123');
  });
});
