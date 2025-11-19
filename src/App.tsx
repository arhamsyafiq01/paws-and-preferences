import { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import type { Cat } from "./type";
import { Heart, X, Loader2, RotateCcw } from "lucide-react";

function App() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [likedCats, setLikedCats] = useState<Cat[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"swipe" | "summary">("swipe");

  // Keep track of all swipe actions for undo
  const [history, setHistory] = useState<
    { cat: Cat; action: "like" | "dislike" }[]
  >([]);

  // --- Animation Logic ---
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

  // Feedback Stamps
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  // --- API Fetch ---
  useEffect(() => {
    fetchCats();
  }, []);

  const fetchCats = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://cataas.com/api/cats?limit=10");
      const data = await response.json();

      // Ensure consistent IDs
      const validCats = data.map((cat: any) => ({
        ...cat,
        _id: cat._id || cat.id,
        tags: Array.isArray(cat.tags) ? cat.tags : [],
      }));

      setCats(validCats);
    } catch (error) {
      console.error("Error fetching cats:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Swipe Logic ---
  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) swipe("right");
    else if (info.offset.x < -threshold) swipe("left");
  };

  const swipe = (direction: "left" | "right") => {
    setExitDirection(direction);

    const cat = cats[currentIndex];

    // Save action to history
    setHistory((prev) => [
      ...prev,
      { cat, action: direction === "right" ? "like" : "dislike" },
    ]);

    setTimeout(() => {
      if (direction === "right") {
        setLikedCats((prev) => [...prev, cat]);
      }

      setCurrentIndex((prev) => prev + 1);
      setExitDirection(null);
      x.set(0);
    }, 200);
  };

  const resetApp = () => {
    setLikedCats([]);
    setCurrentIndex(0);
    fetchCats();
  };

  const undoLast = () => {
    if (history.length === 0 || currentIndex === 0) return;

    const last = history[history.length - 1];

    // Go back one card
    setCurrentIndex((prev) => prev - 1);

    // Remove from liked if it was liked
    if (last.action === "like") {
      setLikedCats((prev) => prev.filter((c) => c._id !== last.cat._id));
    }

    // Remove from history
    setHistory((prev) => prev.slice(0, -1));
  };

  // --- Summary Screen ---
  if (currentIndex >= cats.length && !loading && cats.length > 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 mt-10">
          Purr-fect Matches! 😻
        </h1>

        <p className="mb-6 text-gray-600">You liked {likedCats.length} cats.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl">
          {likedCats.map((cat) => (
            <div
              key={cat._id}
              className="rounded-lg overflow-hidden shadow-md aspect-square"
            >
              <img
                src={`https://cataas.com/cat/${cat._id}`}
                className="w-full h-full object-cover"
                alt="Liked cat"
              />
            </div>
          ))}
        </div>

        <button
          onClick={resetApp}
          className="mt-8 mb-8 flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-semibold shadow-lg hover:bg-pink-600 transition"
        >
          <RotateCcw size={20} /> Start Over
        </button>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 overflow-hidden relative font-sans">
      {/* Header */}
      <div className="text-center pt-10 px-4 w-full z-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
          Paws & Preferences
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mt-1">
          Discover your favorite kitties!
        </p>
      </div>

      {/* Instruction / User Memo */}
      {viewMode === "swipe" && (
        <div className="mt-6 px-2 w-full max-w-230 text-center">
          <div className="bg-yellow-100 dark:bg-yellow-200 text-yellow-800 dark:text-yellow-900 rounded-lg p-4 shadow-md animate-pulse sm:animate-pulse-slow">
            <p className="text-sm sm:text-base">
              🐾 Swipe <span className="font-bold">right</span> to ❤️ like a
              cat, swipe <span className="font-bold">left</span> to ❌ pass. You
              can also tap the buttons below for quick actions.
            </p>
          </div>
        </div>
      )}

      {/* --- Live Counters --- */}
      <div className="mt-4 px-4 w-full flex justify-center">
        <div className="flex items-center gap-6 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-md border border-gray-200">
          {/* Total */}
          <div className="text-center">
            <p className="text-xs uppercase text-gray-500 font-semibold">
              Total
            </p>
            <p className="text-lg font-bold text-gray-800">{cats.length}</p>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300"></div>

          {/* Liked */}
          <div className="text-center">
            <p className="text-xs uppercase text-green-600 font-semibold">
              Liked
            </p>
            <p className="text-lg font-bold text-green-700">
              {likedCats.length}
            </p>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300"></div>

          {/* Disliked */}
          <div className="text-center">
            <p className="text-xs uppercase text-red-600 font-semibold">
              Disliked
            </p>
            <p className="text-lg font-bold text-red-700">
              {Math.max(0, currentIndex - likedCats.length)}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle View Button */}
      <div className="w-full flex justify-center px-4 mt-4 z-50">
        <button
          onClick={() =>
            setViewMode(viewMode === "swipe" ? "summary" : "swipe")
          }
          className="bg-blue-500 text-white px-4 py-2 rounded-full shadow
               hover:bg-blue-600 transition text-sm sm:text-base"
        >
          {viewMode === "swipe" ? "View Gallery" : "Back to Swipe"}
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
          <Loader2 className="animate-spin mb-2 text-pink-500" size={48} />
          <p className="font-medium">Summoning Kittens...</p>
        </div>
      ) : viewMode === "swipe" ? (
        /* --- Card Stack --- */
        <div className="relative w-full max-w-sm h-[65vh] flex items-center justify-center mt-8">
          <AnimatePresence>
            {cats.length > currentIndex && (
              <motion.div
                key={cats[currentIndex]._id}
                style={{ x, rotate, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                animate={
                  exitDirection
                    ? { x: exitDirection === "right" ? 500 : -500, opacity: 0 }
                    : { x: 0, opacity: 1 }
                }
                transition={{ duration: 0.3 }}
                className="absolute w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing px-4"
              >
                {/* Card */}
                <div className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden bg-white border border-gray-100">
                  <img
                    src={`https://cataas.com/cat/${cats[currentIndex]._id}`}
                    alt="Cat"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable="false"
                  />

                  {/* LIKE Stamp */}
                  <motion.div
                    style={{ opacity: likeOpacity }}
                    className="absolute top-8 left-8 border-[6px] border-green-500 text-green-500 font-extrabold text-4xl px-4 py-2 rounded-lg -rotate-12 tracking-widest"
                  >
                    LIKE
                  </motion.div>

                  {/* NOPE Stamp */}
                  <motion.div
                    style={{ opacity: nopeOpacity }}
                    className="absolute top-8 right-8 border-[6px] border-red-500 text-red-500 font-extrabold text-4xl px-4 py-2 rounded-lg rotate-12 tracking-widest"
                  >
                    NOPE
                  </motion.div>

                  {/* Info Gradient */}
                  <div className="absolute bottom-0 w-full p-6 pt-24 text-white from-black/90 via-black/40 to-transparent">
                    <h3 className="text-3xl font-bold drop-shadow-md">
                      {cats[currentIndex].tags?.[0]
                        ? cats[currentIndex].tags[0].charAt(0).toUpperCase() +
                          cats[currentIndex].tags[0].slice(1)
                        : "Mystery Cat"}
                    </h3>

                    {cats[currentIndex].tags &&
                      cats[currentIndex].tags.length > 1 && (
                        <div className="flex gap-2 mt-2 overflow-hidden">
                          {cats[currentIndex].tags.slice(1, 3).map((tag) => (
                            <span
                              key={tag}
                              className="bg-white/20 px-2 py-1 rounded text-xs backdrop-blur-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* --- Summary / Gallery (CENTERED with divider) --- */
        <div className="mt-20 w-full flex justify-center">
          <div className="w-full max-w-5xl px-4">
            <div className="flex flex-col md:flex-row items-start md:items-stretch justify-center gap-6">
              {/* Liked column */}
              <div className="flex-1 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-3 text-center">
                  Liked Cats ❤️
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                  {likedCats.length > 0 ? (
                    likedCats.map((cat) => (
                      <div key={cat._id} className="flex justify-center">
                        <img
                          src={`https://cataas.com/cat/${cat._id}`}
                          alt="Liked cat"
                          className="w-28 h-28 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm col-span-full text-center">
                      No liked cats yet
                    </p>
                  )}
                </div>
              </div>

              {/* Divider (visible on >= md) */}
              <div className="hidden md:flex items-center">
                <div className="w-px bg-gray-300"></div>
              </div>

              {/* Disliked column */}
              <div className="flex-1 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-3 text-center">
                  Disliked Cats ❌
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                  {cats
                    .slice(0, currentIndex)
                    .filter((cat) => !likedCats.some((c) => c._id === cat._id))
                    .length > 0 ? (
                    cats
                      .slice(0, currentIndex)
                      .filter(
                        (cat) => !likedCats.some((c) => c._id === cat._id)
                      )
                      .map((cat) => (
                        <div key={cat._id} className="flex justify-center">
                          <img
                            src={`https://cataas.com/cat/${cat._id}`}
                            alt="Disliked cat"
                            className="w-28 h-28 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-sm col-span-full text-center">
                      No disliked cats yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons (Bottom Center) */}
      {!loading && viewMode === "swipe" && currentIndex < cats.length && (
        <div className="w-full flex justify-center mt-6 mb-10 pointer-events-auto">
          <div className="flex gap-8 z-50">
            {/* Dislike */}
            <button
              onClick={() => swipe("left")}
              className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:scale-110 hover:bg-red-50 transition-all duration-200"
            >
              <X size={32} strokeWidth={3} />
            </button>

            {/* Like */}
            <button
              onClick={() => swipe("right")}
              className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 hover:scale-110 hover:bg-green-50 transition-all duration-200"
            >
              <Heart size={32} fill="currentColor" />
            </button>

            {/* Undo */}
            <button
              onClick={undoLast}
              className="w-16 h-16 bg-purple-300 rounded-full shadow-xl flex items-center justify-center
                   text-yellow-900 hover:scale-110 hover:bg-yellow-200 transition-all duration-200"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
