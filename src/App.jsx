import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { NhostProvider } from "@nhost/react";
import { nhost } from "./lib/nhost";
import { NhostApolloProvider } from "@nhost/react-apollo";

function App() {
  return (
    <div className="min-h-screen">
      <NhostProvider nhost={nhost}>
        <NhostApolloProvider nhost={nhost}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            </Routes>
          </BrowserRouter>
        </NhostApolloProvider>
      </NhostProvider>
    </div>
  );
}

export default App;
