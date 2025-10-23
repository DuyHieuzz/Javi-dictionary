import { useState } from "react";
import SearchBar from "./SearchBar";
import CategoryTabs from "./CategoryTabs";

export default function SearchSection() {
    const [category, setCategory] = useState("vocab");

    return (
        <div className="flex flex-col items-start py-5 px-4 bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
            <SearchBar />
            <CategoryTabs onChange={(key) => setCategory(key)} />
        </div>
    );
}
