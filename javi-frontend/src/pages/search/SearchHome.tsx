import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchHomeContent from "../../components/search/SearchHomeContent";
import RecentComments from "../../components/comment/RecentComments";
import SearchSection from "@/components/search/SearchSection";

export default function SearchHome() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState<"word" | "kanji" | "grammar">(
        "word"
    );

    useEffect(() => {
        if (location.pathname.includes("/kanji")) setActiveTab("kanji");
        else if (location.pathname.includes("/grammar"))
            setActiveTab("grammar");
        else setActiveTab("word");
    }, [location.pathname]);

    const handleSearch = (kw: string) => {
        if (kw.trim())
            navigate(`/search/${activeTab}/${encodeURIComponent(kw.trim())}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-[75%] flex flex-col gap-6">
                <SearchSection onSubmit={handleSearch} activeTab={activeTab} />

                <div className="flex flex-col gap-6">
                    <SearchHomeContent />
                </div>
            </div>

            <div className="w-full md:w-[25%]">
                <RecentComments />
            </div>
        </div>
    );
}
