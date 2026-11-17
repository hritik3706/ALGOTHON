import { FC, useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Sparkles,
  Activity,
} from 'lucide-react';

type VisualizerType = 'binary_search' | 'sliding_window' | 'bfs';

interface Step {
  line: number;
  note: string;
  data: any;
}

export const VisualizerScreen: FC = () => {
  const [activeType, setActiveType] = useState<VisualizerType>('binary_search');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1000); // ms per step

  // 1. Binary Search State
  const bsArray = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const [bsTarget, setBsTarget] = useState(23);

  // 2. Sliding Window State
  const swArray = [2, 1, 5, 1, 3, 2, 4, 3];
  const [swK, setSwK] = useState(3);

  // Generate Steps for Binary Search
  const generateBinarySearchSteps = (arr: number[], target: number): Step[] => {
    const steps: Step[] = [];
    let low = 0;
    let high = arr.length - 1;

    steps.push({
      line: 1,
      note: `Initialize search bounds: low = 0 (${arr[0]}), high = ${high} (${arr[high]}). Target is ${target}.`,
      data: { low, high, mid: -1, found: false },
    });

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      steps.push({
        line: 3,
        note: `Calculate middle element: mid = ${mid} (arr[${mid}] = ${arr[mid]}). Comparing with target ${target}.`,
        data: { low, high, mid, found: false },
      });

      if (arr[mid] === target) {
        steps.push({
          line: 4,
          note: `Target ${target} found at index ${mid}! Binary search completed successfully.`,
          data: { low, high, mid, found: true },
        });
        return steps;
      } else if (arr[mid] < target) {
        steps.push({
          line: 5,
          note: `arr[${mid}] (${arr[mid]}) < ${target}. Target must be in right half. Discarding indices [${low}..${mid}]. Move low to ${mid + 1}.`,
          data: { low, high, mid, found: false },
        });
        low = mid + 1;
      } else {
        steps.push({
          line: 6,
          note: `arr[${mid}] (${arr[mid]}) > ${target}. Target must be in left half. Discarding indices [${mid}..${high}]. Move high to ${mid - 1}.`,
          data: { low, high, mid, found: false },
        });
        high = mid - 1;
      }
    }

    steps.push({
      line: 7,
      note: `Search range exhausted (low > high). Target ${target} is not in the array.`,
      data: { low, high, mid: -1, found: false, notFound: true },
    });
    return steps;
  };

  // Generate Steps for Sliding Window
  const generateSlidingWindowSteps = (arr: number[], k: number): Step[] => {
    const steps: Step[] = [];
    if (k > arr.length) return steps;

    let windowSum = 0;
    for (let i = 0; i < k; i++) windowSum += arr[i];
    let maxSum = windowSum;

    steps.push({
      line: 1,
      note: `Compute initial window of size K=${k} [indices 0..${k - 1}]: Sum = ${windowSum}. Initial maxSum = ${maxSum}.`,
      data: { left: 0, right: k - 1, currentSum: windowSum, maxSum },
    });

    for (let r = k; r < arr.length; r++) {
      const l = r - k + 1;
      const leavingVal = arr[r - k];
      const enteringVal = arr[r];
      windowSum = windowSum - leavingVal + enteringVal;
      const newMax = Math.max(maxSum, windowSum);

      steps.push({
        line: 2,
        note: `Slide window right: Subtract leaving element arr[${r - k}] (${leavingVal}), add entering element arr[${r}] (${enteringVal}). New window sum = ${windowSum}.${newMax > maxSum ? ` New record maximum: ${newMax}!` : ''}`,
        data: { left: l, right: r, currentSum: windowSum, maxSum: newMax },
      });
      maxSum = newMax;
    }

    steps.push({
      line: 4,
      note: `Traversed full array in O(N) time! Maximum contiguous subarray sum of size ${k} is ${maxSum}.`,
      data: { left: arr.length - k, right: arr.length - 1, currentSum: windowSum, maxSum, complete: true },
    });

    return steps;
  };

  const steps: Step[] =
    activeType === 'binary_search'
      ? generateBinarySearchSteps(bsArray, bsTarget)
      : generateSlidingWindowSteps(swArray, swK);

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [activeType, bsTarget, swK]);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev + 1 < steps.length) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, speed]);

  const handleNext = () => {
    if (currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Step-by-Step State Simulator</span>
          </div>
          <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
            Algorithm <em className="italic text-accent">Interactive Visualizers</em>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1 max-w-2xl">
            See pointer movements, invariant checks, and state transitions evolve in real-time. Develop subconscious algorithmic intuition.
          </p>
        </div>

        {/* Algorithm Type Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-2/60 border border-border rounded-xl font-mono text-xs">
          <button
            onClick={() => setActiveType('binary_search')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeType === 'binary_search'
                ? 'bg-accent text-accent-ink font-bold'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            Binary Search
          </button>
          <button
            onClick={() => setActiveType('sliding_window')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeType === 'sliding_window'
                ? 'bg-accent text-accent-ink font-bold'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            Sliding Window
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <Card className="p-6 bg-surface border-border space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-ink font-mono text-xs font-bold hover:bg-accent-hover transition-colors flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl bg-surface-2 border border-border hover:border-accent disabled:opacity-40 text-fg transition-colors"
              title="Previous Step"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentStepIndex >= steps.length - 1}
              className="p-2 rounded-xl bg-surface-2 border border-border hover:border-accent disabled:opacity-40 text-fg transition-colors"
              title="Next Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-surface-2 border border-border hover:text-accent text-fg-muted transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-fg-faint">
              Step <strong className="text-accent">{currentStepIndex + 1}</strong> of {steps.length}
            </span>
            <div className="flex items-center gap-1 bg-surface-2/60 border border-border px-2 py-1 rounded-lg">
              <span className="text-fg-faint text-[10px]">Speed:</span>
              <button
                onClick={() => setSpeed(1400)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${speed === 1400 ? 'bg-accent text-accent-ink font-bold' : 'text-fg-muted'}`}
              >
                0.7x
              </button>
              <button
                onClick={() => setSpeed(900)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${speed === 900 ? 'bg-accent text-accent-ink font-bold' : 'text-fg-muted'}`}
              >
                1x
              </button>
              <button
                onClick={() => setSpeed(450)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${speed === 450 ? 'bg-accent text-accent-ink font-bold' : 'text-fg-muted'}`}
              >
                2x
              </button>
            </div>
          </div>
        </div>

        {/* Binary Search Animation Arena */}
        {activeType === 'binary_search' && (
          <div className="space-y-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-fg-faint">Target to find:</span>
                <select
                  value={bsTarget}
                  onChange={(e) => setBsTarget(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-fg font-bold"
                >
                  {bsArray.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                  <option value={99}>99 (Not Present)</option>
                </select>
              </div>

              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span className="text-fg-muted">Active Window</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-fg-muted">Mid Element</span>
                </span>
              </div>
            </div>

            {/* Array Cells */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 select-none">
              {bsArray.map((num, idx) => {
                const { low, high, mid, found } = currentStep.data;
                const inRange = idx >= low && idx <= high;
                const isMid = idx === mid;
                const isFound = isMid && found;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    {/* Top Pointer Badges */}
                    <div className="h-6 flex items-center justify-center font-mono text-[10px] font-bold">
                      {idx === low && <span className="text-accent">LOW</span>}
                      {idx === high && idx !== low && <span className="text-accent">HIGH</span>}
                      {idx === mid && <span className="text-emerald-400 ml-1">MID</span>}
                    </div>

                    {/* Cell Block */}
                    <div
                      className={`w-full aspect-square rounded-2xl flex items-center justify-center font-mono text-base font-bold transition-all duration-300 border ${
                        isFound
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)] scale-105'
                          : isMid
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 scale-105'
                          : inRange
                          ? 'bg-accent/15 border-accent/40 text-fg shadow-[0_0_10px_rgba(255,107,91,0.15)]'
                          : 'bg-surface-2/20 border-border/30 text-fg-faint/40 opacity-40'
                      }`}
                    >
                      {num}
                    </div>

                    {/* Bottom Index Label */}
                    <span className="font-mono text-[10px] text-fg-faint">[{idx}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sliding Window Animation Arena */}
        {activeType === 'sliding_window' && (
          <div className="space-y-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-fg-faint">Window Size (K):</span>
                <select
                  value={swK}
                  onChange={(e) => setSwK(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-fg font-bold"
                >
                  <option value={2}>K = 2</option>
                  <option value={3}>K = 3</option>
                  <option value={4}>K = 4</option>
                </select>
              </div>

              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="px-3 py-1 rounded-lg bg-surface-2 border border-border text-fg">
                  Current Sum: <strong className="text-accent">{currentStep.data.currentSum}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-surface-2 border border-border text-fg">
                  Max Sum: <strong className="text-emerald-400">{currentStep.data.maxSum}</strong>
                </span>
              </div>
            </div>

            {/* Sliding Array Blocks */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 select-none">
              {swArray.map((num, idx) => {
                const { left, right } = currentStep.data;
                const inWindow = idx >= left && idx <= right;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className="h-6 flex items-center justify-center font-mono text-[10px] font-bold">
                      {idx === left && <span className="text-accent">L</span>}
                      {idx === right && <span className="text-accent ml-1">R</span>}
                    </div>

                    <div
                      className={`w-full aspect-square rounded-2xl flex items-center justify-center font-mono text-lg font-bold transition-all duration-300 border ${
                        inWindow
                          ? 'bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(255,107,91,0.25)] scale-105'
                          : 'bg-surface-2/30 border-border/40 text-fg-faint opacity-50'
                      }`}
                    >
                      {num}
                    </div>

                    <span className="font-mono text-[10px] text-fg-faint">[{idx}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Explanation Note Bar */}
        <div className="p-4 rounded-xl bg-surface-2/60 border border-accent/20 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="font-mono text-xs text-fg leading-relaxed">
            {currentStep.note}
          </div>
        </div>
      </Card>
    </div>
  );
};
