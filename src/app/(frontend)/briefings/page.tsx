import { permanentRedirect } from "next/navigation";

// The briefings section starts at its upcoming dates.
export default function BriefingsIndex() {
  permanentRedirect("/briefings/live");
}
