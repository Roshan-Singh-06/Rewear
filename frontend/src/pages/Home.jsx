import React from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import ImageSlider from './components/ImageSlider';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

const Home = () => {
  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg">
        <Hero />
        <SearchBar />
      </Container>
      <ImageSlider />
      <Container maxWidth="lg">
        <Categories />
        <ProductList />
      </Container>
      <HowItWorks />
      <Footer />
    </Box>
  );
};

export default Home;
