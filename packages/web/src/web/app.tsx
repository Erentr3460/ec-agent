import { Switch, Route } from "wouter";
import { Layout } from "./components/layout";
import DashboardPage from "./pages/index";
import BlogPage from "./pages/blog";
import SeoPage from "./pages/seo";
import PricePage from "./pages/price";
import ImagePage from "./pages/image-gen";
import SettingsPage from "./pages/settings";
import ChatPage from "./pages/chat";

function App() {
  return (
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
  );
}

export default App;
