import { RichText } from "@atproto/api";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../Auth";
import { Link } from "react-router-dom";

const LINE_RETURN_REGEX = /[\r\n]/;

// handles line breaks
export function mapTextToComponents(text: string) {
  if (!text.match(LINE_RETURN_REGEX)) {
    return text;
  }
  return text
    .split(LINE_RETURN_REGEX)
    .flatMap((segment, segmentIndex, segments) => {
      if (segmentIndex === segments.length - 1) {
        return segment;
      }
      return [segment, <br key={`line-break-${segmentIndex}`} />];
    });
}

function mapSegmentsToComponents(segments: ReturnType<RichText["segments"]>) {
  const components = [];
  let segmentIndex = 0;
  for (const segment of segments) {
    if (segment.isMention()) {
      components.push(
        <Link
          to={`/profile/${segment.text.substring(1)}`}
          className="text-primary"
          key={segmentIndex}
        >
          {mapTextToComponents(segment.text)}
        </Link>
      );
    } else if (segment.isLink()) {
      components.push(
        <a
          href={segment.link?.uri}
          className="text-primary"
          target="_blank"
          itemRef="nofollow"
          key={segmentIndex}
        >
          {mapTextToComponents(segment.text)}
        </a>
      );
    } else {
      components.push(
        <span key={segmentIndex}>{mapTextToComponents(segment.text)}</span>
      );
    }
    segmentIndex++;
  }
  return components;
}

interface PostTextProps {
  text: string;
  isFeatured?: boolean;
}

export default function PostText({ text, isFeatured }: PostTextProps) {
  const { state: authState } = useAuth();
  const [formattedText, setFormattedText] = useState<ReactNode>(text);

  useEffect(() => {
    const richText = new RichText({ text });
    if (!authState.agent) {
      return;
    }
    richText.detectFacets(authState.agent).then(() => {
      setFormattedText(mapSegmentsToComponents(richText.segments()));
    });
  }, [authState.agent, text]);

  return <div className={isFeatured ? "text-xl" : ""}>{formattedText}</div>;
}
