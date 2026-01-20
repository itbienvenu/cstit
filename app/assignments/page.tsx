import StudentAssignmentList from "@/components/assignments/StudentAssignmentList";
import Navbar from "@/components/Navbar";

export default function AssignmentsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-20">
                <StudentAssignmentList />
            </div>
        </div>
    );
}
