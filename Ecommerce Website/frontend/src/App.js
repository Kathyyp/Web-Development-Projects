import "./App.css";

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./components/Home";
import ProductDetails from "./components/product/ProductDetails";
import Login from "./components/user/Login";
import Register from "./components/user/Register";

import Cart from "./components/cart/Cart";
import ListOrders from "./components/order/ListOrders";

import { loadUser } from "./actions/userActions";
import store from "./store";
import ProtectedRoute from './components/route/ProtectedRoute'


function App() {
  useEffect(() => {
    store.dispatch(loadUser());

    // async function getStripApiKey() {
    //   const { data } = await axios.get('/api/v1/stripeapi');

    //   setStripeApiKey(data.stripeApiKey)
    // }

    // getStripApiKey();
  }, []);

  return (
    <Router>
      <div className="App">
        <Header />
        <div className="container container-fluid">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search/:keyword" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />

            <Route path="/cart" element={<Cart />} />
            <Route
              path="/orders/me"
              element={
                <ProtectedRoute>
                  {" "}
                  <ListOrders />{" "}
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
