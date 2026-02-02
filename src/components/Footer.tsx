import { Github } from "lucide-react";

export function Footer() {
    return (
        <footer className="mt-16 py-8 border-t border-border/50">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center space-x-6">
                    <a
                        href="https://github.com/starrftw/awaken-connect"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                        aria-label="GitHub"
                    >
                        <Github className="h-6 w-6" />
                    </a>
                    <a
                        href="https://x.com/starrftw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                        aria-label="X (Twitter)"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                </div>
                <p className="text-sm text-muted-foreground">
                    Awaken Connect - Export transactions for tax compliance
                </p>
            </div>
        </footer>
    );
}
