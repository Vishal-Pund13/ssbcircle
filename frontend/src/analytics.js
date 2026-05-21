import ReactGA from 'react-ga4';

export const initGA = () => {
  console.log('GA ID:', import.meta.env.VITE_GA_ID);
  if (import.meta.env.VITE_GA_ID) {
    ReactGA.initialize(import.meta.env.VITE_GA_ID);
  }
};

export const trackPageView = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};
