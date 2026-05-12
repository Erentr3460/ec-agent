import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { Layout } from "./components/layout";
import DashboardPage from "./pages/index";
import BlogPage from "./pages/blog";
import SeoPage from "./pages/seo";
import PricePage from "./pages/price";
import ImagePage from "./pages/image-gen";
import SettingsPage from "./pages/settings";
import ChatPage from "./pages/chat";
import { MatrixBg } from "./components/matrix-bg";
import { ParticleNet } from "./components/particle-net";
import { CyberCursor } from "./components/cyber-cursor";
import { IntroScreen } from "./components/intro-screen";

function App() {
  const [introVisible, setIntroVisible] = useState(() => {
    // Show intro only once per session
    return !sessionStorage.getItem("ec_intro_shown");
  });

  const handleIntroDone = () => {
    sessionStorage.setItem("ec_intro_shown", "1");
    setIntroVisible(false);
  };

  return (
    <>
      {/* Global background layers */}
      <MatrixBg />
      <ParticleNet />

      {/* Custom cursor — always rendered */}
      <CyberCursor />

      {/* Boot intro — once per session */}
      {introVisible && <IntroScreen onDone={handleIntroDone} />}

      {/* App routes */}
      <Switch>
        {/* Chat is full-screen, NO Layout wrapper */}
        <Route path="/chat" component={ChatPage} />

        {/* Everything else inside Layout */}
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/blog" component={BlogPage} />
              <Route path="/seo" component={SeoPage} />
              <Route path="/price" component={PricePage} />
              <Route path="/image" component={ImagePage} />
              <Route path="/settings" component={SettingsPage} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </>
  );
}

export default App;
