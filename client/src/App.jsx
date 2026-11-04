import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { Shell } from './components/Shell.jsx';

const pageLoaders = import.meta.glob('./pages/*.jsx');
function page(name) {
  return lazy(async () => {
    const loader = pageLoaders[`./pages/${name}.jsx`];
    if (!loader) throw new Error(`Page module ${name} was not found.`);
    const module = await loader();
    return { default: module[name] };
  });
}

const Landing=page('Landing'), AuthPage=page('AuthPage'), Dashboard=page('Dashboard'), Languages=page('Languages'), Settings=page('Settings'), LanguageDetails=page('LanguageDetails'), Learning=page('Learning'), CharacterDetails=page('CharacterDetails'), Vocabulary=page('Vocabulary'), Dictionary=page('Dictionary'), Grammar=page('Grammar'), Sentences=page('Sentences'), Courses=page('Courses'), CourseLesson=page('CourseLesson'), AssessmentPage=page('AssessmentPage'), Listening=page('Listening'), Speaking=page('Speaking'), Tutor=page('Tutor'), Conversations=page('Conversations'), CourseAdmin=page('CourseAdmin'), Culture=page('Culture'), Communities=page('Communities'), Contribute=page('Contribute'), CommunityTalk=page('CommunityTalk'), CulturalReview=page('CulturalReview'), MyCommunity=page('MyCommunity'), CulturalDetail=page('CulturalDetail');

function Guard({ children }) { const { user, loading } = useAuth(); if (loading) return <div className="screen-loading" role="status">Opening your learning space…</div>; return user ? children : <Navigate to="/login" replace />; }

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  useEffect(() => {
    const language = user?.preferences?.interfaceLanguage === 'ne' ? 'ne' : 'en';
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    const path = location.pathname.split('/').filter(Boolean);
    const title = path.length ? `${path[path.length - 1].replaceAll('-', ' ')} · Matribhasha` : 'Matribhasha — Learn your roots';
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Learn languages and preserve the stories, knowledge, and cultural heritage shared by communities.');
  }, [location.pathname, user?.preferences?.interfaceLanguage]);
  return <Suspense fallback={<div className="screen-loading" role="status">Loading your learning space…</div>}><Routes>
    <Route path="/" element={<Landing />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<Guard><Shell /></Guard>}>
      <Route path="/home" element={<Dashboard />} /><Route path="/languages" element={<Languages />} /><Route path="/languages/:id" element={<LanguageDetails />} />
      <Route path="/learn" element={<Learning />} /><Route path="/learn/characters/:id" element={<CharacterDetails />} /><Route path="/vocabulary" element={<Vocabulary />} /><Route path="/dictionary" element={<Dictionary />} /><Route path="/grammar" element={<Grammar />} /><Route path="/sentences" element={<Sentences />} />
      <Route path="/courses" element={<Courses />} /><Route path="/courses/:id" element={<Courses />} /><Route path="/courses/:courseId/lesson/:lessonId" element={<CourseLesson />} /><Route path="/assessments/:id" element={<AssessmentPage />} /><Route path="/listening" element={<Listening />} /><Route path="/speaking" element={<Speaking />} /><Route path="/conversations" element={<Conversations />} />
      <Route path="/culture" element={<Culture />} /><Route path="/culture/:id" element={<CulturalDetail kind="culture" />} /><Route path="/stories/:id" element={<CulturalDetail kind="story" />} /><Route path="/cultural-media/:id" element={<CulturalDetail kind="media" />} /><Route path="/communities" element={<Communities />} /><Route path="/contribute" element={<Contribute />} /><Route path="/my-community" element={<MyCommunity />} /><Route path="/discussions" element={<CommunityTalk />} />
      <Route path="/admin/culture" element={<CulturalReview />} /><Route path="/admin/courses" element={<CourseAdmin />} /><Route path="/tutor" element={<Tutor />} /><Route path="/settings" element={<Settings />} />
    </Route><Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
