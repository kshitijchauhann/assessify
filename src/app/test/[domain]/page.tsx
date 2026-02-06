'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

// Helper to format time (MM:SS)
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function TestPage({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = use(params);
    const router = useRouter();

    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    // const [candidateName, setCandidateName] = useState(''); // Removed
    // const [nameSubmitted, setNameSubmitted] = useState(false); // Removed
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Fetch questions
    useEffect(() => {
        if (domain) {
            fetch(`/api/questions?domain=${domain}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.questions) {
                        setQuestions(data.questions);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [domain]);

    // Timer
    useEffect(() => {
        if (loading || submitting) return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, loading, submitting]);

    const handleOptionSelect = (questionText: string, option: string) => {
        setAnswers((prev) => ({ ...prev, [questionText]: option }));
    };

    // Check for existing completion
    useEffect(() => {
        if (domain) {
            // Verify if user has already completed this test (if logged in)
            fetch('/api/user/assignments')
                .then(res => res.json())
                .then(data => {
                    if (data.assignments) {
                        const assignment = data.assignments.find((a: any) => a.domain === domain);
                        if (assignment && assignment.status === 'completed') {
                            alert("You have already completed this test.");
                            router.push('/dashboard');
                        }
                    }
                })
                .catch(() => {
                    // Ignore error if not logged in or other issue, 
                    // but ideally we should block if auth is required.
                });
        }
    }, [domain, router]);

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain,
                    candidateName: undefined, // Backend relies on session
                    answers,
                }),
            });

            if (response.ok) {
                // Requirement: "should not be able to see result which is displayed after submission"
                alert("Test Submitted Successfully! Returning to dashboard.");
                router.push('/dashboard');
            } else {
                alert('Failed to submit test. Please try again.');
                setSubmitting(false);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-20">Loading questions...</div>;

    // Direct render, no name check
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-background z-10 py-4 border-b">
                <div className="flex items-center gap-4">
                    <Image src="/assessifyLogo.svg" alt="Assessify Logo" width={120} height={32} className="h-8 w-auto" />
                    <h1 className="text-2xl font-bold capitalize">{domain.replace('-', ' ')} Test</h1>
                </div>
                <div className={`text-xl font-mono ${timeLeft < 60 ? 'text-red-500' : ''}`}>
                    Time Left: {formatTime(timeLeft)}
                </div>
            </div>

            <div className="mb-6 flex justify-between items-center bg-muted p-4 rounded-lg">
                <div>
                    <h3 className="font-semibold text-lg">Question {currentStep + 1} of {questions.length}</h3>
                </div>
                <Progress value={((currentStep + 1) / questions.length) * 100} className="w-1/3 h-2" />
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {questions[currentStep].question}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup
                            value={answers[questions[currentStep].question] || ''}
                            onValueChange={(val) => handleOptionSelect(questions[currentStep].question, val)}
                        >
                            {questions[currentStep].options.map((option: string, optIndex: number) => (
                                <div key={optIndex} className="flex items-center space-x-2 mb-4 p-2 rounded hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value={option} id={`opt${optIndex}`} />
                                    <Label htmlFor={`opt${optIndex}`} className="cursor-pointer font-normal w-full">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0 || submitting}
                >
                    Previous
                </Button>

                {currentStep < questions.length - 1 ? (
                    <Button
                        onClick={() => setCurrentStep(prev => Math.min(questions.length - 1, prev + 1))}
                    >
                        Next
                    </Button>
                ) : (
                    <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Test'}
                    </Button>
                )}
            </div>
        </div>
    );
}
