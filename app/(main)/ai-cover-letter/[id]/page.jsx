import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoverLetter } from "@/actions/cover-letter";
import CoverLetterPreview from "../_components/cover-letter-preview";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2 mb-2">
        <div>
          <Link href="/ai-cover-letter">
            <Button variant="link" className="gap-2 pl-0">
              <ArrowLeft className="h-4 w-4" />
              Back to Cover Letters
            </Button>
          </Link>
        </div>

        <h1 className="text-6xl font-bold gradient-title mb-6">
          {coverLetter?.jobTitle} @ {coverLetter?.companyName}
        </h1>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Description :</h3>
          <div className="p-4 border rounded-lg bg-muted/50">
            {coverLetter?.jobDescription}
          </div>
        </div>
      </div>

      <CoverLetterPreview id={coverLetter?.id} content={coverLetter?.content} />
    </div>
  );
}
