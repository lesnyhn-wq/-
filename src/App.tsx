import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useQuestions } from '@/hooks/useQuestions';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { StartScreen } from '@/components/StartScreen';
import { GameScreen } from '@/components/GameScreen';
import { SettingsPanel } from '@/components/SettingsPanel';
import { QuestionList } from '@/components/QuestionList';
import { OnlineLobby } from '@/components/OnlineLobby';
import { OnlineGameScreen } from '@/components/OnlineGameScreen';

type Modal = 'none' | 'settings' | 'list';
type View = 'home' | 'online';

function App() {
  const { questions, addQuestion, updateQuestion, deleteQuestion, resetToDefault } = useQuestions();
  const game = useGame(questions);
  const online = useOnlineGame();
  const [modal, setModal] = useState<Modal>('none');
  const [view, setView] = useState<View>('home');

  const inGame = game.round !== null && game.currentQuestion !== null && !game.roundComplete;
  const inOnlineVoting =
    view === 'online' &&
    online.session !== null &&
    online.room !== null &&
    online.room.phase !== 'lobby';

  // Online voting/results view takes priority once the game starts
  if (inOnlineVoting) {
    return (
      <>
        <OnlineGameScreen online={online} onExit={() => setView('home')} />
        <SettingsPanel
          open={modal === 'settings'}
          onClose={() => setModal('none')}
          settings={game.settings}
          onUpdate={game.updateSettings}
          onShuffle={game.shuffleDeck}
          onRestart={game.restartGame}
        />
      </>
    );
  }

  if (view === 'online') {
    return (
      <>
        <OnlineLobby online={online} onExit={() => setView('home')} />
        <SettingsPanel
          open={modal === 'settings'}
          onClose={() => setModal('none')}
          settings={game.settings}
          onUpdate={game.updateSettings}
          onShuffle={game.shuffleDeck}
          onRestart={game.restartGame}
        />
      </>
    );
  }

  // If we land back on home but an online session lingers, clear it
  useEffect(() => {
    if (view === 'home' && online.session) {
      online.leaveRoom();
    }
  }, [view, online.session, online]);

  return (
    <>
      {inGame && game.currentQuestion ? (
        <GameScreen
          question={game.currentQuestion}
          questionNumber={game.seenCount}
          totalInDeck={game.round?.deck.length ?? game.totalQuestions}
          totalShown={game.round?.totalShown ?? 0}
          roundComplete={game.roundComplete}
          animKey={game.animKey}
          votes={game.round?.votes ?? {}}
          questions={questions}
          onNext={game.nextQuestion}
          onRandom={game.randomQuestion}
          onSkip={game.skipQuestion}
          onVote={game.voteQuestion}
          onHome={game.exitToHome}
          onOpenSettings={() => setModal('settings')}
          onOpenList={() => setModal('list')}
          onRestart={game.restartGame}
          onEndRound={game.endRoundEarly}
        />
      ) : game.roundComplete && game.currentQuestion ? (
        <GameScreen
          question={game.currentQuestion}
          questionNumber={game.seenCount}
          totalInDeck={game.round?.deck.length ?? game.totalQuestions}
          totalShown={game.round?.totalShown ?? 0}
          roundComplete={true}
          animKey={game.animKey}
          votes={game.round?.votes ?? {}}
          questions={questions}
          onNext={game.nextQuestion}
          onRandom={game.randomQuestion}
          onSkip={game.skipQuestion}
          onVote={game.voteQuestion}
          onHome={game.exitToHome}
          onOpenSettings={() => setModal('settings')}
          onOpenList={() => setModal('list')}
          onRestart={game.restartGame}
          onEndRound={game.endRoundEarly}
        />
      ) : (
        <StartScreen
          onStart={game.startNewRound}
          onContinue={game.continueRound}
          onOpenList={() => setModal('list')}
          onOpenSettings={() => setModal('settings')}
          onOpenOnline={() => setView('online')}
          totalQuestions={game.totalQuestions}
          hasSavedRound={game.hasSavedRound}
          savedProgress={game.savedProgress}
          savedDeckLength={game.savedDeckLength}
        />
      )}

      <SettingsPanel
        open={modal === 'settings'}
        onClose={() => setModal('none')}
        settings={game.settings}
        onUpdate={game.updateSettings}
        onShuffle={game.shuffleDeck}
        onRestart={game.restartGame}
      />

      {modal === 'list' && (
        <QuestionList
          onClose={() => setModal('none')}
          questions={questions}
          onAdd={addQuestion}
          onUpdate={updateQuestion}
          onDelete={deleteQuestion}
          onReset={resetToDefault}
        />
      )}
    </>
  );
}

export default App;
