
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import WhyChooseUs from '@/components/home/WhyChooseUs';

const Index = () => {
  return (
    <>
      <Navbar />
      <main dir="rtl">
        <Hero />
        <FeaturedProducts />
        <WhyChooseUs />
      </main>
      <Footer />
    </>
  );
};

export default Index;
