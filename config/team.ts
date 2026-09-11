/** The Zcash India core team, shown on /about. */
export type TeamMember = {
  name: string;
  role: string;
  xHandle?: string;
  bio: string;
};

export const team: TeamMember[] = [
  {
    name: "Jatin Sahijwani",
    role: "Project Lead",
    xHandle: "jatinsahijwani",
    bio: "Co-founder of HackTour India. Web3 developer and 15x hackathon winner, including ETHIndia and ETHGlobal. Leads strategy, events and milestone delivery.",
  },
  {
    name: "Anirudh Singh Chouhan",
    role: "Community & Events Lead",
    xHandle: "AnirudhSingh07",
    bio: "Co-founder of HackTour India. Full-stack Web3 developer and 15x hackathon winner. Leads on-ground event execution and university partnerships.",
  },
  {
    name: "Karan Verma",
    role: "Content & Social Media",
    bio: "Core HackTour India member specialising in video production, graphic design and social media management.",
  },
  {
    name: "Jayesh Sharma",
    role: "Media Lead",
    xHandle: "jayesh_iot",
    bio: "Handles video shooting, content recording, YouTube channel operations, event recordings, aftermovies and video editing.",
  },
  {
    name: "Vaibhav Raj Singh Panwar",
    role: "Distribution & Partnerships Lead",
    xHandle: "VaibhavRaj9538",
    bio: "Manages partnership outreach, regional content creation and distribution strategy. Started as a community host and bounty winner.",
  },
];
