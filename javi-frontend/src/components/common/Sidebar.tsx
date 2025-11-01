import { Link, useLocation } from "react-router-dom";
import { LiaLanguageSolid } from "react-icons/lia";
import {
    PiTranslateLight,
    PiCube,
    PiCrownSimpleLight,
    PiCrownSimpleFill,
    PiBookBookmarkFill,
    PiBookBookmark,
} from "react-icons/pi";
import javi from "../../assets/javi-logo.png";
import { IoCube } from "react-icons/io5";

const links = [
    { path: "/search/word", label: "Tra cứu", icon: <LiaLanguageSolid /> },
    { path: "/translate", label: "Dịch", icon: <PiTranslateLight /> },
    {
        path: "/jlpt",
        label: "JLPT",
        icon: <PiBookBookmark />,
        selectIcon: <PiBookBookmarkFill />,
    },
    {
        path: "/intro",
        label: "Giới thiệu",
        icon: <PiCube />,
        selectIcon: <IoCube />,
    },
    {
        path: "/premium",
        label: "Nâng cấp",
        icon: <PiCrownSimpleLight />,
        selectIcon: <PiCrownSimpleFill />,
    },
];

// Thêm interface cho props
interface SidebarProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
    const location = useLocation();

    return (
        <>
            {/* Overlay cho mobile */}
            <div
                className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden ${
                    open ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
                onClick={() => setOpen(false)}
            />

            {/* Sidebar cố định */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-[214px]
                            bg-gradient-to-b from-[#3e66d4] to-[#2c3f84]
                            text-white flex flex-col transform transition-transform duration-300
                            ${open ? "translate-x-0" : "-translate-x-full"}
                            md:translate-x-0 md:z-40`}
            >
                <Link to="/">
                    <div className="flex justify-center items-center my-3">
                        <img
                            src={javi}
                            alt="Javi logo"
                            className="w-[80px] h-[46px] object-cover"
                        />
                    </div>
                </Link>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto">
                    <ul className="space-y-1">
                        {links.map(({ path, label, icon, selectIcon }) => {
                            // Nếu là "Tra cứu" (path bắt đầu /search) thì active cho tất cả /search/*
                            const isSearch = path.startsWith("/search");
                            const active = isSearch
                                ? location.pathname.startsWith("/search")
                                : location.pathname === path;

                            return (
                                <li key={path}>
                                    <Link
                                        to={path}
                                        className={`flex items-center px-[18px] py-[8px] my-[4px] mx-2 text-[16px] transition-all duration-500 ${
                                            active
                                                ? "bg-[#d0e0f9] text-[#262a34] rounded-2xl"
                                                : "text-white/90 hover:text-white"
                                        }`}
                                        onClick={() => setOpen(false)}
                                    >
                                        {icon && (
                                            <span
                                                className={`text-[24px] mr-[12px] flex-shrink-0 ${
                                                    active
                                                        ? "text-[#3e66d4]"
                                                        : "text-white"
                                                }`}
                                            >
                                                {active && selectIcon
                                                    ? selectIcon
                                                    : icon}
                                            </span>
                                        )}
                                        {label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
}
