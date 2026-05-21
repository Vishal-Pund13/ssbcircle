import ReactGA from 'react-ga4';

export const initGA = () => {
  if (import.meta.env.VITE_GA_ID) {
    ReactGA.initialize(import.meta.env.VITE_GA_ID);
  }
};

export const trackPageView = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};
