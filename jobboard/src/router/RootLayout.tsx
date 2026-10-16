import { Suspense } from "react";
import Navbar from "../navigation/Navbar";
import { Outlet } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

function RootLayout(){
	return (
		<div className="min-h-screen bg-paper">
			<Navbar />
			<Suspense fallback={<div className="py-24"><LoadingSpinner/></div>}>
				<Outlet />
			</Suspense>
		</div>
	);
}

export default RootLayout;