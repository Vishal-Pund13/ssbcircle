import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeReader from './SwipeReader';
import rupeeData             from '../../data/articles/rupee-depreciation.json';
import elNinoData            from '../../data/articles/super-el-nino.json';
import womenWorkforceData    from '../../data/articles/women-workforce-paradox.json';
import womenProxyData        from '../../data/articles/women-proxy-representation.json';
import womenGlassCeilingData from '../../data/articles/women-glass-ceiling.json';
import womenPayGapData       from '../../data/articles/women-gender-pay-gap.json';
import womenSafetyData       from '../../data/articles/women-safety-economy.json';
import womenEducationData    from '../../data/articles/women-education-gap.json';
import womenHealthData       from '../../data/articles/women-health-india.json';

const ARTICLES = {
  'rupee-depreciation':         rupeeData,
  'super-el-nino':              elNinoData,
  'women-workforce-paradox':    womenWorkforceData,
  'women-proxy-representation': womenProxyData,
  'women-glass-ceiling':        womenGlassCeilingData,
  'women-gender-pay-gap':       womenPayGapData,
  'women-safety-economy':       womenSafetyData,
  'women-education-gap':        womenEducationData,
  'women-health-india':         womenHealthData,
};

// Ordered list — defines swipe-up/down article navigation sequence
const ARTICLE_ORDER = [
  'rupee-depreciation',
  'super-el-nino',
  'women-workforce-paradox',
  'women-proxy-representation',
  'women-glass-ceiling',
  'women-gender-pay-gap',
  'women-safety-economy',
  'women-education-gap',
  'women-health-india',
];

export default function ReadPage() {
  const { articleId } = useParams();
  const navigate      = useNavigate();
  const location      = useLocation();
  const article       = ARTICLES[articleId];

  // navDir: 1 = swiped up (next article enters from below),
  //        -1 = swiped down (prev article enters from above),
  //         0 = direct navigation (no animation)
  const navDir = location.state?.navDir ?? 0;

  const idx      = ARTICLE_ORDER.indexOf(articleId);
  const nextSlug = idx >= 0 && idx < ARTICLE_ORDER.length - 1 ? ARTICLE_ORDER[idx + 1] : null;
  const prevSlug = idx > 0 ? ARTICLE_ORDER[idx - 1] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Article not found</p>
          <p className="text-xs text-gray-400 mb-4">"{articleId}" doesn't exist yet.</p>
          <Link to="/current-affairs" className="btn-primary text-sm px-4 py-2">Browse articles</Link>
        </div>
      </div>
    );
  }

  const goNext = nextSlug ? () => navigate(`/read/${nextSlug}`, { state: { navDir: 1 }  }) : undefined;
  const goPrev = prevSlug ? () => navigate(`/read/${prevSlug}`, { state: { navDir: -1 } }) : undefined;

  return (
    <div className="overflow-hidden" style={{ height: '100dvh' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={articleId}
          initial={{
            y:       navDir === 1 ? '8%' : navDir === -1 ? '-8%' : 0,
            opacity: navDir !== 0 ? 0 : 1,
          }}
          animate={{ y: 0, opacity: 1 }}
          exit={{
            y:       navDir === 1 ? '-8%' : navDir === -1 ? '8%' : 0,
            opacity: 0,
          }}
          transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%' }}
        >
          <SwipeReader
            article={article}
            onClose={() => navigate('/current-affairs')}
            onNextArticle={goNext}
            onPrevArticle={goPrev}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
