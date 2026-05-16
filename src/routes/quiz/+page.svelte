<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { quizResult } from '$lib/stores/quizStore';

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

  interface RawIdiom {
    id: number;
    phrase: string;
    reading: string;
    meaning: string;
    usage: string;
  }

  let quizQuestions = $state<QuizQuestion[]>([]);

  // APIからデータを取得する関数
  async function fetchData() {
    try {
      const response = await fetch(`http://localhost:8080/api/hello?genre=${genre}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: RawIdiom[] = await response.json();
      
      // データをランダムにシャッフルして最大10問を抽出
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 10);

      // 抽出したデータを現在のクイズ設定に合わせて変換
      quizQuestions = selected.map((item) => {
        const isMeaningQuiz = mode === 'meaning_4_choice';
        const question = isMeaningQuiz ? item.phrase : item.meaning;
        const correctAnswer = isMeaningQuiz ? item.meaning : item.phrase;
        
        let choices: string[] | undefined;
        if (mode !== 'name_exact') {
          // 全データ（data）から誤答（ダミー）を作成して、選択肢の多様性を確保
          const distractors = data
            .filter(i => i.id !== item.id)
            .map(i => isMeaningQuiz ? i.meaning : i.phrase);
          
          // 正解と誤答を混ぜてランダムに4つ選んでシャッフル
          choices = [correctAnswer, ...distractors.sort(() => Math.random() - 0.5).slice(0, 3)]
            .sort(() => Math.random() - 0.5);
        }

        return {
          id: item.id,
          type: mode as any,
          question,
          correctAnswer,
          choices,
          hint: item.reading[0] // 読みの1文字目をヒントに設定
        };
      });
    } catch (error) {
      console.error('データ取得エラー:', error);
    }
  }

  // ページが表示された時に一度だけ実行
  $effect(() => {
    fetchData();
  });

  let currentQuestionIndex = $state(0);
  let userAnswer = $state('');
  let feedbackMessage = $state('');
  let showHint = $state(false);
  let isAnswerSubmitted = $state(false);
  let quizSessionStarted = $state(false);
  let correctCount = $state(0);
  let selectedChoice = $state<string | null>(null);

  // インデックスに基づいて現在の問題を自動計算
  const currentQuestion = $derived(quizQuestions[currentQuestionIndex]);

  // 問題が切り替わったときに回答状況などをリセットする
  $effect(() => {
    currentQuestionIndex; // 依存関係として認識させるために参照
    quizQuestions; // 問題リスト自体が変わった時もリセット
    userAnswer = '';
    feedbackMessage = '';
    showHint = false;
    isAnswerSubmitted = false;
    selectedChoice = null;
  });

  function submitAnswer() {
    isAnswerSubmitted = true;
    quizSessionStarted = true;
    let correct = false;

    if (currentQuestion.type === 'name_exact') {
      correct = userAnswer.trim() === currentQuestion.correctAnswer;
    } else {
      correct = selectedChoice === currentQuestion.correctAnswer;
    }

    if (correct) {
      feedbackMessage = '正解！';
      correctCount++;
    } else {
      feedbackMessage = `不正解！\n正解は「${currentQuestion.correctAnswer}」でした。`;
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      currentQuestionIndex++;
    } else {
      const scoreValue = Math.round((correctCount / quizQuestions.length) * 100);
      quizResult.set({
        genre,
        mode,
        score: scoreValue,
        correct: correctCount,
        total: quizQuestions.length
      });
      goto('/result');
    }
  }

  function toggleHint() {
    showHint = !showHint;
  }

  const isSubmitActive = $derived(
    (currentQuestion?.type === 'name_exact' && userAnswer.trim().length > 0) ||
    ((currentQuestion?.type === 'meaning_4_choice' || currentQuestion?.type === 'name_4_choice') && selectedChoice !== null)
  );
</script>

<main class="min-h-[100dvh] bg-slate-50 flex flex-col font-sans">
  <header class="bg-white border-b border-slate-200 px-4 py-6 text-center shrink-0">
    <h1 class="text-3xl font-black text-slate-900 tracking-tight">クイズアプリ</h1>
  </header>
{#if quizQuestions.length > 0 && currentQuestion}

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
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">問題</span>
      </div>
      <div class="bg-white p-4 rounded-xl shadow-sm mb-4">
        <p class="text-base text-slate-700 font-medium">
          {#if currentQuestion?.type === 'name_exact'}
            以下の意味から{genreLabel}を入力してください。
          {:else if currentQuestion?.type === 'meaning_4_choice'}
            以下の{genreLabel}の意味を選択してください。
          {:else}
            以下の意味から{genreLabel}を選択してください。
          {/if}
        </p>
      </div>

      <!-- 意味エリア -->
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
          {#each currentQuestion?.choices || [] as choice, i}
            <button
              on:click={() => selectedChoice = choice}
              class="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center
                {selectedChoice === choice && !isAnswerSubmitted ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/10' : 'border-white bg-white shadow-sm hover:border-slate-200 active:scale-[0.98]'}
                {isAnswerSubmitted && choice === currentQuestion.correctAnswer ? 'border-green-500 bg-green-50 ring-4 ring-green-500/10' : ''}
                {isAnswerSubmitted && selectedChoice === choice && selectedChoice !== currentQuestion.correctAnswer ? 'border-red-500 bg-red-50 ring-4 ring-red-500/10' : ''}"
              disabled={isAnswerSubmitted}
            >
              <span class="text-lg font-medium {selectedChoice === choice && !isAnswerSubmitted ? 'text-indigo-700' : 'text-slate-800'}">
                {i + 1}. {choice}
              </span>
            </button>
          {/each}
        {/if}
      </div>

      {#if feedbackMessage}
        <div class="p-4 rounded-xl mb-6 text-center
          {feedbackMessage.startsWith('正解！') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} whitespace-pre-wrap">
          <p class="font-bold whitespace-pre-wrap">{feedbackMessage}</p>
        </div>
      {/if}

      <div class="flex justify-between items-center mt-8">
        <button
          on:click={toggleHint}
          class="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all text-sm font-medium"
          disabled={isAnswerSubmitted}
        >
          ヒント
        </button>

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

      {#if showHint}
        <div class="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-xl text-sm text-center">
          {#if currentQuestion?.hint}
            最初の一文字目は「{currentQuestion.hint}」
          {:else}
            ヒントはありません
          {/if}
        </div>
      {/if}

      <div class="mt-8 p-6 bg-white border-t border-slate-100 shrink-0 rounded-2xl shadow-sm">
        <button
          on:click={() => goto(`/selection?genre=${genre}`)}
          disabled={quizSessionStarted}
          class="w-full text-slate-500 text-sm font-medium enabled:hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 4l-6 6 6 6z" />
          </svg>
          <span>モード選択に戻る</span>
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class="flex-1 flex items-center justify-center">
    <p class="text-slate-500 font-medium italic">問題を読み込み中...</p>
  </div>
{/if}
</main>