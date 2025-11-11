// components/SessionSelector.jsx
'use client';

import { useSession } from '@/context/SessionContext';

export default function SessionSelector() {
  const {currentSession, availableSessions, setCurrentSession, sessionLoading} = useSession();

  return (
    <div className="flex items-center gap-x-4">
      {sessionLoading ? (
          <div className="text-sm text-muted-foreground">
              <span>Loading...</span>
          </div>
      ) : (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                      {currentSession ? `Session: ${currentSession.name}` : 'Select Session'}
                      <ChevronDown className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 ">
                  <DropdownMenuLabel>Select Session</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableSessions.map(session => (
                      <DropdownMenuItem key={session.id} onClick={() => setCurrentSession(session)} className={currentSession?.id === session.id ? 'bg-primary/10' : ''}>
                          {session.name}
                      </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
          </DropdownMenu>
      )}
    </div>
  );
}