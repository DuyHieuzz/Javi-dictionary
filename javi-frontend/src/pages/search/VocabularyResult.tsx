import { useParams, useNavigate } from "react-router-dom";
import VocabularyList from "../../components/vocabulary/VocabularyList";
import VocabularyDetail from "../../components/vocabulary/VocabularyDetail";
import SearchSection from "../../components/search/SearchSection";

export default function VocabularyResult() {
    const { keyword } = useParams();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6">
            <SearchSection />
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-[25%]">
                    <VocabularyList />
                </div>

                <div className="w-full md:w-[75%]">
                    <VocabularyDetail />
                </div>
            </div>
        </div>
    );
}
