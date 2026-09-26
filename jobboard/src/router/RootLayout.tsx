import Navbar from "../navigation/Navbar";
import { Outlet } from "react-router-dom";

function RootLayout(){
	return (
		<div className="min-h-screen bg-paper">
			<Navbar />
			<Outlet />
		</div>
	);
}

export default RootLayout;