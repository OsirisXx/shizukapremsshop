import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, Clock, CreditCard, Zap, Gift, Smile } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

// Define type for proof image
interface Proof {
  id: number;
  image_url: string;
  proof_date?: string | null; // Make date optional for the card display
}

// --- Proof Card Component --- 
const ProofCard: React.FC<{ proof: Proof }> = ({ proof }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-2 border border-pink-100 h-full flex flex-col">
      {/* Image container - Increased height */}
      <div className="h-80 w-full flex-shrink-0 bg-gray-100"> 
        <img 
          src={proof.image_url}
          alt={`Proof ${proof.id}`}
          className="w-full h-full object-cover" // Use object-cover for better fill
          loading="lazy"
        />
      </div>
      {/* Optional Caption Area */}
      {proof.proof_date && (
        <div className="p-3 text-center bg-pink-50 text-xs text-pink-700 font-medium">
          {new Date(proof.proof_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} 
        </div>
      )}
    </div>
  );
};
// --- End Proof Card Component --- 

export const Home: React.FC = () => {
  // Get proofs state and action from store
  const { proofs: storeProofs, fetchProofs, isLoading: storeIsLoading } = useStore(
    (state) => ({ 
      proofs: state.proofs, // Use proofs state
      fetchProofs: state.fetchProofs, // Use fetchProofs action
      isLoading: state.isLoading 
    })
  );
  // No need for separate proofImages state if using storeProofs directly
  // const [proofImages, setProofImages] = useState<ProofImage[]>([]); 
  const [isLoadingProofs, setIsLoadingProofs] = useState(true);

  // Embla Carousel setup with updated Autoplay options
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'center',
      containScroll: 'trimSnaps' 
    }, 
    [Autoplay({ 
        delay: 4000,
        stopOnInteraction: true, 
        stopOnMouseEnter: true, 
        playOnInit: true,
    })]
  );

  // Fetch proofs on mount
  useEffect(() => {
    console.log('Home: Fetching proof images...');
    setIsLoadingProofs(true);
    fetchProofs().finally(() => {
      // Loading state handled by effect below or directly via storeIsLoading
       setIsLoadingProofs(false); // Set loading false after fetch completes
    });
  }, [fetchProofs]);

  // Log state right before rendering the carousel
  console.log("Rendering Proofs Section - isLoadingProofs:", isLoadingProofs, "storeProofs length:", storeProofs.length, "storeProofs:", storeProofs);

  // Log number of slides detected by Embla when API is ready
  useEffect(() => {
    if (emblaApi) {
      console.log("Embla API ready. Number of slides found:", emblaApi.slideNodes().length);
      // Add listener for settle event to see if it scrolls
      const logScroll = () => {
        console.log("Embla event: settle (scroll finished). Current index:", emblaApi.selectedScrollSnap());
      };
      emblaApi.on("settle", logScroll);
      // Clean up listener
      return () => {
        emblaApi.off("settle", logScroll);
      }
    }
  }, [emblaApi]);

  return (
    <div className="flex flex-col min-h-screen bg-pink-50">
      {/* Categories Section */}
      <section id="categories" className="py-16 md:py-20 bg-gradient-to-b from-pink-100 to-pink-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-pink-700 mb-4">Our Categories</h2>
            <p className="text-pink-900 max-w-2xl mx-auto text-lg opacity-90">
              Explore our wide range of premium accounts and programming services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <CategoryCard 
              image="https://images.pexels.com/photos/927629/pexels-photo-927629.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              title="Premium Accounts"
              description="Access to exclusive premium accounts for various platforms and services."
              link="/premium-accounts"
            />
            <CategoryCard 
              image="https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              title="Programming Services"
              description="Professional programming services from experienced developers."
              link="/programming"
            />
          </div>
        </div>
      </section>

      {/* --- Proofs Section --- */}
      <section className="pt-16 md:pt-20 bg-transparent overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-pink-600 mb-4">Our Proofs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Check out some examples of our successful accounts and projects.
            </p>
          </div>
          
          {/* --- Embla Carousel for Proof Cards - Reduced Width --- */}
          <div className="embla w-full max-w-md mx-auto" ref={emblaRef}> {/* Changed max-w-2xl to max-w-md */} 
            <div className="embla__container flex"> 
              {isLoadingProofs ? (
                <div className="embla__slide flex-[0_0_100%] min-w-0">
                    <div className="h-72 flex items-center justify-center text-gray-500">Loading proofs...</div>
                </div>
              ) : storeProofs.length === 0 ? (
                 <div className="embla__slide flex-[0_0_100%] min-w-0">
                    <div className="h-72 flex items-center justify-center text-pink-700 bg-pink-50 rounded-lg p-4">No proofs available yet!</div>
                 </div>
              ) : (
                storeProofs.map((proof) => (
                  <div className="embla__slide flex-[0_0_100%] min-w-0 px-2" key={proof.id}>
                    <ProofCard proof={proof} />
                  </div>
                ))
              )}
            </div>
          </div>
          {/* --- End Embla Carousel --- */}
          
        </div>
      </section>
      {/* --- End Proofs Section --- */}

      {/* CTA Section - Bright Pink */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-pink-500 to-pink-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            className="max-w-xl mx-auto mb-8 text-pink-100 text-lg"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join hundreds of satisfied customers and experience our premium services today.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              size="lg"
              variant="outline"
              className="bg-white text-pink-600 hover:bg-pink-50 font-semibold px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
              onClick={() => {
                document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Our Products
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

interface CategoryCardProps {
  image: string;
  title: string;
  description: string;
  link: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ image, title, description, link }) => {
  return (
    <motion.div 
      className="relative overflow-hidden rounded-xl shadow-lg group"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <img 
        src={image} 
        alt={title} 
        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">{title}</h3>
        <p className="text-pink-100 mb-4 drop-shadow-sm">{description}</p>
        <Link to={link}>
          <Button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-full px-5 py-2 shadow-md transform hover:scale-105 transition-transform duration-300">
            Explore Now
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};