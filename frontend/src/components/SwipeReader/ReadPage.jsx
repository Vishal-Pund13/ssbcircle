import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const article       = ARTICLES[articleId];

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

  return (
    <div className="h-screen overflow-hidden" style={{ height: '100dvh' }}>
      <SwipeReader
        article={article}
        onClose={() => navigate('/current-affairs')}
        onNextArticle={nextSlug ? () => navigate(`/read/${nextSlug}`) : undefined}
        onPrevArticle={prevSlug ? () => navigate(`/read/${prevSlug}`) : undefined}
      />
    </div>
  );
}
