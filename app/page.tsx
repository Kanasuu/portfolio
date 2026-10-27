import Cursor from "@/components/Cursor";
import DreamMap from "@/components/dream/DreamMap";
import MotionRoot from "@/components/MotionRoot";
import RecruiterChat from "@/components/recruiter/RecruiterChat";

export default function Home() {
  return (
    <MotionRoot>
      <DreamMap />
      <RecruiterChat />
      <Cursor />
    </MotionRoot>
  );
}
