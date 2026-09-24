# @cardai/sdk

Manda flashcards do seu app para a conta Card.Ai de quem clicou.

Sem cadastro, sem chave de API, sem servidor do seu lado. Nada entra na conta
de ninguém sem a pessoa entrar e confirmar numa tela do Card.Ai.

```bash
npm i @cardai/sdk
```

## O botão é seu

O caminho principal. O SDK dá o comportamento; a aparência é inteiramente sua.

```tsx
import { useAddToCardAi } from '@cardai/sdk/react';

export function SalvarAula({ aula }) {
  const { add, busy, added, deckId } = useAddToCardAi({
    deckName: aula.titulo,
    text: aula.flashcards,
  });

  if (added) return <a href={`https://cardai.app/flashcard/${deckId}`}>Abrir deck</a>;

  return (
    <MeuBotao onClick={add} disabled={busy}>
      {busy ? 'Salvando…' : 'Salvar no Card.Ai'}
    </MeuBotao>
  );
}
```

Sem React — Vue, Svelte, vanilla, qualquer coisa:

```js
import { addToCardAi } from '@cardai/sdk';

botao.onclick = () => addToCardAi({ deckName: 'Mitose', text });
```

> Chame no handler do clique, sem `await` antes. A janela do Card.Ai abre na
> primeira linha da função porque navegador só deixa abrir dentro do gesto.

## Ou use o nosso

**[Editor do botão](https://cardai.app/developers)**: ajuste cor,
tamanho, rótulo e estilo vendo o preview, e copie o código pronto (HTML ou React).

```tsx
import { CardAiButton } from '@cardai/sdk/react';
import '@cardai/sdk/styles.css';

<CardAiButton deckName="Mitose" text={texto} />
```

Personaliza por variável CSS, de qualquer lugar da árvore:

```css
.minha-sidebar { --cardai-bg: #1F6F66; --cardai-radius: 10px; --cardai-size: 40px; }
```

Ou por Tailwind, sem escrever CSS:

```tsx
<CardAiButton className="[--cardai-bg:#0F172A] [--cardai-radius:10px]" />
```

Variáveis: `--cardai-bg`, `--cardai-fg`, `--cardai-mark-bg`, `--cardai-size`,
`--cardai-radius`, `--cardai-pad`, `--cardai-gap`, `--cardai-font`,
`--cardai-weight`, `--cardai-shadow`, `--cardai-ring`. Todas com fallback, então
herdam.

## Os flashcards

### Texto — o caminho fácil

Uma linha por flashcard. Sem aspas, sem escape, sem JSON.

```
O que é mitose? :: Divisão celular que gera duas células iguais.
Quantas fases tem a mitose? :: Quatro: prófase, metáfase, anáfase e telófase.
A meiose reduz o número de cromossomos {{pela metade}}.
```

`::` separa pergunta e resposta. `{{termo}}` vira uma lacuna. Uma linha sem um
dos dois derruba o lote com o número da linha, em vez de sumir com o card.

### Estruturado — os outros tipos

```ts
cards: [
  { question: 'O que é mitose?', answer: 'Divisão celular.' },

  { type: 'MultipleChoice', question: 'Qual fase separa as cromátides?',
    correct: 'Anáfase', incorrect: ['Prófase', 'Metáfase', 'Telófase', 'Intérfase'] },

  { type: 'ClozeCompletion', question: 'A meiose reduz os cromossomos {{pela metade}}.' },

  { type: 'FreeTextBlock', question: 'Visão geral\nMitose: duas células iguais.' },

  { type: 'TableOcclusion', question: 'Complete a tabela.', headerRow: true,
    rows: [[{ text: 'Fase' }, { text: 'Evento' }],
           [{ text: 'Anáfase' }, { text: 'Cromátides separam', hidden: true }]] },
]
```

Todo texto é **texto puro**: o HTML quem monta é o servidor, então `<` e `>`
viram caractere e nunca tag. Tipo desconhecido ou campo faltando cai para
pergunta-e-resposta em vez de falhar.

### Muitos flashcards

```ts
addToCardAi({ deckName: 'Aula 04', src: '/api/flashcards/aula-04.json' })
```

O arquivo é seu, no seu domínio, com o mesmo formato de `cards`. Lido só no
clique — a página não carrega nada até alguém querer.

### Deixar a IA escrever

```ts
addToCardAi({ mode: 'prompt', deckName: 'Mitose', prompt: 'Flashcards sobre mitose para o ensino médio.' })
```

## Opções

| | |
|---|---|
| `deckName` | nome do deck a criar |
| `text` | `pergunta :: resposta` por linha, ou `{{lacuna}}` |
| `cards` | flashcards estruturados |
| `src` | URL de um JSON com o mesmo formato de `cards` |
| `mode` | `'cards'` (padrão) ou `'prompt'` |
| `prompt`, `sourceText` | conteúdo quando `mode: 'prompt'` |
| `actions` | `'create'` (padrão), `'append'` (a pessoa escolhe um deck que já tem) ou `'both'` |
| `apiUrl`, `appUrl` | só para desenvolvimento ou self-host |

`useAddToCardAi` aceita tudo isso mais `onDone(outcome)`, e devolve
`{ add, busy, added, deckId, error, reset }`.

## Sem React e sem bundler

Uma tag de script e um elemento:

```html
<script src="https://cardai.app/add.js" defer></script>

<card-ai-button deck-name="Mitose e meiose">
  <script type="text/cardai">
    O que é mitose? :: Divisão celular que gera duas células iguais.
  </script>
</card-ai-button>
```

Ou em qualquer botão que já existe na sua página:

```html
<button class="btn btn-primary" data-cardai deck-name="Mitose">Salvar no Card.Ai</button>
```

## Licença

MIT
