import React from "react";
import Home from "./Home";
import NavBar from "./NavBar";
import Waittingroom from "./Waittingroom";
import Loading from "./Loading";
import Modal from "./Modal";
import { useGame } from "./hooks/useGame";

const App = () => {
  const { room } = useGame();
  const joined = !!room?.id;

  return (
    <main className='bg-[url("https://cdn.dribbble.com/users/644659/screenshots/2172516/11111-02.png")] bg-no-repeat bg-cover bg-[top_center] min-h-screen'>
      <NavBar />
      {joined ? <Waittingroom /> : <Home />}
      <Loading />
      <Modal />
    </main>
  );
};

export default App;
