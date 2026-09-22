/** Um flashcard estruturado. Todo texto é texto puro: o HTML quem monta é o
 *  servidor, então `<` e `>` viram caractere, nunca tag. */
export type Card =
  | { type?: 'TextBlock'; question: string; answer: string; questionImageUrl?: string; answerImageUrl?: string }
  /** `correct` mais exatamente 4 em `incorrect`. O servidor embaralha. */
  | { type: 'MultipleChoice'; question: string; correct: string; incorrect: string[] }
  /** A lacuna vai no texto como `{{termo}}`. Não tem resposta. */
  | { type: 'ClozeCompletion'; question: string }
  /** Nota de contexto. Cada linha vira um parágrafo. Não tem resposta. */
  | { type: 'FreeTextBlock'; question: string }
  /** Tabela onde as células `hidden` são o que a pessoa tenta lembrar. */
  | {
      type: 'TableOcclusion';
      question: string;
      rows: Array<Array<{ text: string; hidden?: boolean }>>;
      headerRow?: boolean;
    };

export interface AddOptions {
  /** Nome do deck a criar. Ignorado quando `actions` é `'append'`. */
  deckName?: string;

  /** O caminho fácil: uma linha por flashcard.
   *
   *     pergunta :: resposta
   *     frase com {{lacuna}} escondida
   */
  text?: string;
  /** Flashcards estruturados, para os tipos que texto não expressa. */
  cards?: Card[];
  /** URL de um JSON com o mesmo formato de `cards`. Lido só no clique, o que
   *  mantém a página leve quando são muitos flashcards. */
  src?: string;

  /** `'prompt'` deixa a IA escrever os flashcards a partir do que você mandar. */
  mode?: 'cards' | 'prompt';
  prompt?: string;
  sourceText?: string;

  /** Onde os flashcards caem. `'append'` deixa a pessoa escolher entre os
   *  decks dela; `'both'` oferece as duas coisas. */
  actions?: 'create' | 'append' | 'both';

  /** Só para desenvolvimento ou self-host. */
  apiUrl?: string;
  appUrl?: string;
}

/** Como terminou, do ponto de vista de quem clicou. */
export interface AddOutcome {
  status: 'success' | 'error' | 'closed';
  deckId?: string;
}

export interface AddResult {
  /** Id do rascunho. Já existe no servidor mesmo que a pessoa desista. */
  id: string;
  /** Resolve quando a janela do Card.Ai termina — ou quando é fechada. */
  done: Promise<AddOutcome>;
}
