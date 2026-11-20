"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenText, Bookmark, Check, PlayCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Lesson = { id: string; title: string; description: string; video_url: string; duration_seconds: number | null; sort_order: number; source_url?: string | null; source_attribution?: string | null };
type Course = { id: string; slug: string; title: string; description: string; category: string; level: string; thumbnail_url: string | null; lessons: Lesson[] };
const localAcademyCourse: Course = {
  id: "local-founder-course", slug: "strategy-case-studies", title: "Trading Strategy Case Studies",
  description: "An instructor-led strategy lesson with explicit discussion of assumptions, sizing, and risk.",
  category: "Trading Strategies", level: "Intermediate", thumbnail_url: "https://img.youtube.com/vi/TQVMBcv13oQ/hqdefault.jpg",
  lessons: [{ id: "local-founder-video", title: "The Trading Strategy That Can Be WRONG and Still WIN", description: "Trade with Pat demonstrates a multi-entry grid strategy and explains how position sizing can affect outcomes. The lesson also discusses risk; the video is educational content, not investment advice.", video_url: "https://www.youtube-nocookie.com/embed/TQVMBcv13oQ", duration_seconds: 700, sort_order: 1, source_url: "https://www.youtube.com/watch?v=TQVMBcv13oQ", source_attribution: "Trade with Pat" }]
};
const readLocalList = (key: string): string[] => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
export default function Academy() {
  const client = useMemo(() => { try { return supabaseBrowser(); } catch { return null; } }, []);
  const [courses, setCourses] = useState<Course[]>([]), [uid, setUid] = useState<string | null>(null), [completed, setCompleted] = useState<string[]>([]), [bookmarks, setBookmarks] = useState<string[]>([]), [courseId, setCourseId] = useState<string | null>(null), [lessonId, setLessonId] = useState<string | null>(null), [category, setCategory] = useState("All categories"), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const useLocalCourse = (notice = "") => { if (cancelled) return; setCourses([localAcademyCourse]); setCourseId(localAcademyCourse.id); setLessonId(localAcademyCourse.lessons[0].id); setCompleted(readLocalList("valtiera_academy_completed")); setBookmarks(readLocalList("valtiera_academy_bookmarks")); setError(notice); setLoading(false); };
    if (!client) { useLocalCourse("DEMO COURSE · Progress and bookmarks are saved in this browser."); return () => { cancelled = true; }; }
    void (async () => {
      const auth = await client.auth.getUser(), user = auth.data.user;
      if (cancelled) return;
      setUid(user?.id || null);
      const result = await client.from("courses").select("id,slug,title,description,category,level,thumbnail_url,lessons(id,title,description,video_url,duration_seconds,sort_order,source_url,source_attribution)").eq("status", "published").order("created_at");
      if (result.error) { useLocalCourse("COURSE CATALOGUE UNAVAILABLE · Showing the local demo lesson. Apply the learning migration to sync progress."); return; }
      const list = (result.data || []).map((course: any) => ({ ...course, lessons: (course.lessons || []).sort((a: Lesson, b: Lesson) => a.sort_order - b.sort_order) })) as Course[];
      if (!list.length) { useLocalCourse("DEMO COURSE · No published course is in the catalogue yet. Progress stays in this browser."); return; }
      setCourses(list); const selected = list[0]; setCourseId(selected.id); setLessonId(selected.lessons[0]?.id || null);
      if (user) {
        const [progress, saved] = await Promise.all([client.from("lesson_progress").select("lesson_id").eq("user_id", user.id), client.from("lesson_bookmarks").select("lesson_id").eq("user_id", user.id)]);
        if (!cancelled) { if (!progress.error) setCompleted(progress.data.map(row => row.lesson_id)); if (!saved.error) setBookmarks(saved.data.map(row => row.lesson_id)); }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [client]);
  const categories = ["All categories", ...new Set(courses.map(course => course.category))];
  const visible = category === "All categories" ? courses : courses.filter(course => course.category === category);
  const selectedCourse = courses.find(course => course.id === courseId) || visible[0] || null;
  const selectedLesson = selectedCourse?.lessons.find(lesson => lesson.id === lessonId) || selectedCourse?.lessons[0] || null;
  const localProgress = (key: string, lesson: Lesson, current: string[], setCurrent: (next: string[]) => void) => { const next = current.includes(lesson.id) ? current.filter(id => id !== lesson.id) : [...current, lesson.id]; localStorage.setItem(key, JSON.stringify(next)); setCurrent(next); };
  async function toggleComplete(lesson: Lesson) {
    if (lesson.id.startsWith("local-") || !uid || !client) { localProgress("valtiera_academy_completed", lesson, completed, setCompleted); return; }
    const done = completed.includes(lesson.id), result = done ? await client.from("lesson_progress").delete().eq("user_id", uid).eq("lesson_id", lesson.id) : await client.from("lesson_progress").insert({ user_id: uid, lesson_id: lesson.id });
    if (result.error) setError(result.error.message); else setCompleted(current => done ? current.filter(id => id !== lesson.id) : [...current, lesson.id]);
  }
  async function toggleBookmark(lesson: Lesson) {
    if (lesson.id.startsWith("local-") || !uid || !client) { localProgress("valtiera_academy_bookmarks", lesson, bookmarks, setBookmarks); return; }
    const saved = bookmarks.includes(lesson.id), result = saved ? await client.from("lesson_bookmarks").delete().eq("user_id", uid).eq("lesson_id", lesson.id) : await client.from("lesson_bookmarks").insert({ user_id: uid, lesson_id: lesson.id });
    if (result.error) setError(result.error.message); else setBookmarks(current => saved ? current.filter(id => id !== lesson.id) : [...current, lesson.id]);
  }
  const progress = (course: Course) => course.lessons.length ? Math.round(course.lessons.filter(lesson => completed.includes(lesson.id)).length / course.lessons.length * 100) : 0;
  return <><div className="terminal-heading compact"><div><div className="terminal-kicker">VALTIERA ACADEMY · OPEN COURSES</div><h1>Learn the language of markets.</h1><p>Publisher and instructor-led videos with progress saved to your member account.</p></div><BookOpenText size={29}/></div>{error && <div className="community-alert">{error}</div>}{loading && <div className="community-empty">Loading published courses…</div>}{!loading && courses.length === 0 && <div className="community-empty"><h2>Course catalogue unavailable</h2><p>Apply the learning migration and check your Supabase connection.</p></div>}{courses.length > 0 && <><div className="academy-course-bar"><span>{selectedCourse?.id.startsWith("local-") ? "DEMO COURSE · PROGRESS IN THIS BROWSER" : uid ? "LEARNING PROGRESS SYNCED TO YOUR ACCOUNT" : "COURSE PREVIEW · SIGN IN TO SAVE PROGRESS"}</span><select value={category} onChange={event => setCategory(event.target.value)} aria-label="Course category">{categories.map(value => <option key={value}>{value}</option>)}</select></div><div className="academy-catalog">{visible.map(course => <button key={course.id} className={selectedCourse?.id === course.id ? "academy-course-card active" : "academy-course-card"} onClick={() => { setCourseId(course.id); setLessonId(course.lessons[0]?.id || null); }}>
    {course.thumbnail_url && <img src={course.thumbnail_url} alt=""/>}<span>{course.category} · {course.level}</span><b>{course.title}</b><small>{course.lessons.length} lessons · {progress(course)}% complete</small><div className="course-progress"><i style={{ width: `${progress(course)}%` }}/></div></button>)}</div>{selectedCourse && <div className="academy-learning-grid"><main className="academy-player-panel">{selectedLesson ? <><div className="academy-video">{selectedLesson.video_url.startsWith("/media/") ? <video controls preload="metadata" poster={selectedCourse.thumbnail_url || undefined} src={selectedLesson.video_url} aria-label={selectedLesson.title}/> : <iframe src={selectedLesson.video_url} title={selectedLesson.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>}</div><div className="academy-lesson-heading"><div><span>{selectedLesson.source_attribution || "VALTIERA ACADEMY"} · {selectedCourse.category}</span><h2>{selectedLesson.title}</h2><p>{selectedLesson.description}</p>{selectedLesson.source_url && <a className="panel-link" href={selectedLesson.source_url} target="_blank" rel="noreferrer">View original source <ArrowRight size={14}/></a>}</div><button className={bookmarks.includes(selectedLesson.id) ? "watch-symbol active" : "watch-symbol"} onClick={() => void toggleBookmark(selectedLesson)}><Bookmark size={14}/>{bookmarks.includes(selectedLesson.id) ? "Saved" : "Bookmark"}</button></div><h3>Lesson notes</h3><ul className="academy-objectives"><li>Compare the strategy’s entry and position-sizing rules with its stated assumptions.</li><li>Identify the drawdown, trend, and execution risks described in the lesson.</li><li>Review the instructor’s educational disclaimer; the video is not investment advice.</li></ul><button className="button dark" onClick={() => void toggleComplete(selectedLesson)}><Check size={14}/>{completed.includes(selectedLesson.id) ? "Mark incomplete" : "Mark lesson complete"}</button></> : <p>This course has no available lessons.</p>}</main><aside className="academy-syllabus"><div><span>COURSE CONTENT</span><h2>{selectedCourse.title}</h2><p>{selectedCourse.description}</p><div className="course-progress"><i style={{ width: `${progress(selectedCourse)}%` }}/></div><small>{progress(selectedCourse)}% complete</small></div>{selectedCourse.lessons.map((lesson, index) => <button key={lesson.id} className={lesson.id === selectedLesson?.id ? "academy-lesson-row active" : "academy-lesson-row"} onClick={() => setLessonId(lesson.id)}><span>{completed.includes(lesson.id) ? <Check size={14}/> : <PlayCircle size={15}/>}</span><div><b>{index + 1}. {lesson.title}</b><small>{completed.includes(lesson.id) ? "Completed" : lesson.source_attribution || "Academy video"}</small></div><ArrowRight size={14}/></button>)}{bookmarks.length > 0 && <div className="academy-saved-note">{bookmarks.length} lesson{bookmarks.length === 1 ? "" : "s"} bookmarked</div>}</aside></div>}</>}</>;
}

