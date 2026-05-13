<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const genre = $page.url.searchParams.get('genre') || 'yoji';
  const mode = $page.url.searchParams.get('mode') || 'meaning_4_choice';

  const genreLabel = genre === 'yoji' ? '四字熟語' : 'ことわざ';

  interface QuizQuestion {
    id: number;
    question: string;
    correctAnswer: string;
    choices?: string[];
    hint?: string;
    type: 'meaning_4_choice' | 'name_4_choice' | 'name_exact';
  }

  // Mock data for 10 questions
  const mockQuestions: QuizQuestion[] = [
    // Yoji - Meaning 4 choice (question is Yojijukugo, correctAnswer is meaning, choices are meanings)
    { id: 1, type: 'meaning_4_choice', question: '意気投合', correctAnswer: '意気が投じ合い、互いに話が合うこと。', choices: ['意気が投じ合い、互いに話が合うこと。', '言葉によらず互いの心と心で通じ合うこと。', '一度きりの出会いを大切にすること。', '危険が迫っていて、少しの油断もできないこと。'], hint: 'い' },
    { id: 2, type: 'meaning_4_choice', question: '以心伝心', correctAnswer: '言葉によらず互いの心と心で通じ合うこと。', choices: ['言葉によらず互いの心と心で通じ合うこと。', '意気が投じ合い、互いに話が合うこと。', '一つの行為で二つの利益を得ること。', '昔の事柄や学問を研究し、そこから新しい知識や見解を得ること。'], hint: 'い' },
    // Yoji - Name 4 choice (for now, similar to meaning_4_choice, but could be fill-in-the-blank later)
    { id: 3, type: 'name_4_choice', question: '一度きりの出会いを大切にすること。', correctAnswer: '一期一会', choices: ['一期一会', '一石二鳥', '危機一髪', '温故知新'], hint: 'い' },
    { id: 4, type: 'name_4_choice', question: '一つの行為で二つの利益を得ること。', correctAnswer: '一石二鳥', choices: ['一石二鳥', '一期一会', '危機一髪', '温故知新'], hint: 'い' },
    // Yoji - Name exact
    { id: 5, type: 'name_exact', question: '危険が迫っていて、少しの油断もできないこと。', correctAnswer: '危機一髪', hint: 'き' },
    { id: 6, type: 'name_exact', question: '昔の事柄や学問を研究し、そこから新しい知識や見解を得ること。', correctAnswer: '温故知新', hint: 'お' },

    // Koto - Meaning 4 choice (question is Kotowaza, correctAnswer is meaning, choices are meanings)
    { id: 7, type: 'meaning_4_choice', question: '猿も木から落ちる', correctAnswer: 'どんな名人でも失敗することがあるということ。', choices: ['どんな名人でも失敗することがあるということ。', '辛抱強く努力すれば、必ず成功するということ。', 'わずかなものでも、積もり積もれば大きなものになるということ。', '急ぐときは、危険な近道よりも安全な遠回りをする方が結局は早いということ。'], hint: 'さ' },
    { id: 8, type: 'meaning_4_choice', question: '石の上にも三年', correctAnswer: '辛抱強く努力すれば、必ず成功するということ。', choices: ['辛抱強く努力すれば、必ず成功することがあるということ。', 'どんな名人でも失敗することがあるということ。', 'わずかなものでも、積もり積もれば大きなものになるということ。', '急ぐときは、危険な近道よりも安全な遠回りをする方が結局は早いということ。'], hint: 'い' },
    // Koto - Name 4 choice
    { id: 9, type: 'name_4_choice', question: 'わずかなものでも、積もり積もれば大きなものになるということ。', correctAnswer: '塵も積もれば山となる', choices: ['塵も積もれば山となる', '石の上にも三年', '猿も木から落ちる', '急がば回れ'], hint: 'ち' },
    { id: 10, type: 'name_4_choice', question: '急ぐときは、危険な近道よりも安全な遠回りをする方が結局は早いということ。', correctAnswer: '急がば回れ', choices: ['急がば回れ', '塵も積もれば山となる', '石の上にも三年', '猿も木から落ちる'], hint: 'い' },
  ];

  // Filter questions based on genre and mode
  // Note: This is a simplified filter. In a real app, you'd fetch 10 random questions
  // from a larger dataset based on genre and mode.
  const quizQuestions = mockQuestions.filter(q => {
    if (genre === 'yoji') {
      return q.id <= 6 && q.type === mode;
    } else { // koto
      return q.id > 6 && q.type === mode;
    }
  });

  let currentQuestionIndex = 0;
  let currentQuestion: QuizQuestion;
  let userAnswer: string = '';
  let feedbackMessage: string = '';
  let showHint: boolean = false;
  let isAnswerSubmitted: boolean = false;
  let selectedChoice: string | null = null; // For 4-choice questions

  // Reactive statement to update currentQuestion when index changes
  $: {
    if (quizQuestions.length > 0) {
      currentQuestion = quizQuestions[currentQuestionIndex];
      userAnswer = ''; // Reset answer for new question
      feedbackMessage = '';
      showHint = false;
      isAnswerSubmitted = false;
      selectedChoice = null;
    }
  }

  function submitAnswer() {
    isAnswerSubmitted = true;
    let correct = false;

    if (currentQuestion.type === 'name_exact') {
      correct = userAnswer.trim() === currentQuestion.correctAnswer;
    } else { // 4-choice types
      correct = selectedChoice === currentQuestion.correctAnswer;
    }

    if (correct) {
      feedbackMessage = '正解！';
    } else {
      feedbackMessage = `不正解！\n正解は「${currentQuestion.correctAnswer}」でした。`;
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      currentQuestionIndex++;
    } else {
      alert('クイズ終了！結果画面へ遷移します。（未実装）');
      // TODO: Implement navigation to results screen
      goto('/'); // Go back to home for now
    }
  }

  function toggleHint() {
    showHint = !showHint;
  }

  // Determine if the submit button should be active
  $: isSubmitActive = (currentQuestion?.type === 'name_exact' && userAnswer.trim().length > 0) ||
                      ((currentQuestion?.type === 'meaning_4_choice' || currentQuestion?.type === 'name_4_choice') && selectedChoice !== null);

</script>

<main class="min-h-[100dvh] bg-slate-50 flex flex-col font-sans">
  <header class="bg-white border-b border-slate-200 px-4 py-6 text-center shrink-0">
    <h1 class="text-3xl font-black text-slate-900 tracking-tight">クイズアプリ</h1>
  </header>

  <div class="flex-1 overflow-y-auto p-6 flex flex-col items-center">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h2 class="text-xl font-bold text-slate-900 mb-2">
          {genreLabel} クイズ - {currentQuestionIndex + 1} / {quizQuestions.length}
        </h2>
        <p class="text-sm text-slate-600">
          {mode === 'meaning_4_choice' ? '意味当て' : (mode === 'name_4_choice' ? '名称当て（選択）' : '名称当て（記述）')}
        </p>
      </div>

      <!-- 問題エリア -->
      <div class="mb-2 ml-1">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">意味</span>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <p class="text-lg font-semibold text-slate-800 leading-relaxed">
          {currentQuestion?.question}
        </p>
      </div>

      <!-- 回答エリア -->
      <div class="mb-2 ml-1">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {currentQuestion?.type === 'name_exact' ? '名称を入力' : '回答を選択'}
        </span>
      </div>
      <div class="space-y-4 mb-6">
        {#if currentQuestion?.type === 'name_exact'}
          <!-- 記述式 -->
          <input
            type="text"
            bind:value={userAnswer}
            placeholder="ここに回答を入力"
            class="w-full p-4 border-2 rounded-xl text-lg focus:outline-none focus:border-indigo-500 transition-colors
                   {isAnswerSubmitted && userAnswer.trim() !== currentQuestion.correctAnswer ? 'border-red-500' : ''}
                   {isAnswerSubmitted && userAnswer.trim() === currentQuestion.correctAnswer ? 'border-green-500' : ''}"
            disabled={isAnswerSubmitted}
          />
        {:else}
          <!-- 4択 -->
          {#each currentQuestion?.choices || [] as choice}
            <button
              on:click={() => selectedChoice = choice}
              class="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center
                {selectedChoice === choice && !isAnswerSubmitted ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/10' : 'border-white bg-white shadow-sm hover:border-slate-200 active:scale-[0.98]'}
                {isAnswerSubmitted && choice === currentQuestion.correctAnswer ? 'border-green-500 bg-green-50 ring-4 ring-green-500/10' : ''}
                {isAnswerSubmitted && selectedChoice === choice && selectedChoice !== currentQuestion.correctAnswer ? 'border-red-500 bg-red-50 ring-4 ring-red-500/10' : ''}"
              disabled={isAnswerSubmitted}
            >
              <span class="text-lg font-medium {selectedChoice === choice && !isAnswerSubmitted ? 'text-indigo-700' : 'text-slate-800'}">
                {choice}
              </span>
            </button>
          {/each}
        {/if}
      </div>

      <!-- フィードバックメッセージ -->
      {#if feedbackMessage}
        <div class="p-4 rounded-xl mb-6 text-center
          {feedbackMessage.startsWith('正解！') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} whitespace-pre-wrap">
          <p class="font-bold whitespace-pre-wrap">{feedbackMessage}</p>
        </div>
      {/if}

      <!-- アクションエリア -->
      <div class="flex justify-between items-center mt-8">
        <!-- ヒントボタン -->
        <button
          on:click={toggleHint}
          class="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all text-sm font-medium"
          aria-label="ヒント"
          disabled={isAnswerSubmitted}
        >
          ヒント
        </button>

        <!-- 確定/次へボタン -->
        {#if !isAnswerSubmitted}
          <button
            on:click={submitAnswer}
            class="py-3 px-6 bg-indigo-600 text-white rounded-full font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all
                   {isSubmitActive ? '' : 'opacity-50 cursor-not-allowed'}"
            disabled={!isSubmitActive}
          >
            確定
          </button>
        {:else}
          <button
            on:click={nextQuestion}
            class="py-3 px-6 bg-emerald-600 text-white rounded-full font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
          >
            次へ
          </button>
        {/if}
      </div>

      <!-- ヒント表示 -->
      {#if showHint}
        <div class="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-xl text-sm text-center">
          ヒント: {currentQuestion?.hint || 'ヒントはありません'}
        </div>
      {/if}

      <!-- フッター -->
      <div class="mt-8 p-6 bg-white border-t border-slate-100 shrink-0 rounded-2xl shadow-sm">
        <button
          on:click={() => goto(`/selection?genre=${genre}`)}
          disabled={quizSessionStarted}
          class="w-full text-slate-500 text-sm font-medium enabled:hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M13 4l-6 6 6 6z" />
          </svg>
          <span>モード選択に戻る</span>
        </button>
      </div>
    </div>
  </div>
</main>