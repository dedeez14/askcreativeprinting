import { useLenis } from './hooks/useLenis';
import Header from './sections/Header';
import Hero from './sections/Hero';
import About from './sections/About';
import Services from './sections/Services';
import DesignStudio from './sections/DesignStudio';
import Clients from './sections/Clients';
import Contact from './sections/Contact';

export default function App() {
  useLenis();

  return (
    <div className="relative">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <DesignStudio />
        <Clients />
        <Contact />
      </main>
    </div>
  );
}
