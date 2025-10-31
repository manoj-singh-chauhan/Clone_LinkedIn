import Header from "../components/Header";
import Post from "../components/Post";
import Feed from "../components/Feed/Feed";
import UploadProgress from "../components/UploadProgress";
import SortByFilter from "../components/SortByFilter";

const Home = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-y-auto relative">
        <Post />
        <SortByFilter />
        <Feed />
        <UploadProgress />
      </div>
    </div>
  );
};

export default Home;
