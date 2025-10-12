"use client";

import * as React from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import {
  MessageSquare, Send, Paperclip, Search, Phone, Video, MoreVertical,
  Users, User, Bell, BellOff, Archive, Star, Trash2, Reply, Forward,
  Check, CheckCheck, Clock, AlertCircle, Image as ImageIcon, FileText,
  Smile, AtSign, Hash, Filter, Plus, X, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN';
  profileImageUrl?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Attachment[];
  replyTo?: Message;
  isEdited?: boolean;
  editedAt?: Date;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio';
  size: number;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'broadcast';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  createdAt: Date;
}

interface CommunicationHubProps {
  currentUser: User;
  conversations: Conversation[];
  messages: Record<string, Message[]>; // conversationId -> messages
  users: User[];
  onSendMessage: (conversationId: string, content: string, attachments?: File[]) => Promise<void>;
  onCreateConversation: (participants: string[], name?: string, type?: 'direct' | 'group') => Promise<string>;
  onMarkAsRead: (conversationId: string, messageId: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
}

export function CommunicationHub({
  currentUser,
  conversations,
  messages,
  users,
  onSendMessage,
  onCreateConversation,
  onMarkAsRead,
  onDeleteMessage,
  onEditMessage,
}: CommunicationHubProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    conversations[0]?.id || null
  );
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current conversation
  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConversation);
  }, [conversations, selectedConversation]);

  // Get current messages
  const currentMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return messages[selectedConversation] || [];
  }, [messages, selectedConversation]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Tab filter
    if (selectedTab === 'unread') {
      filtered = filtered.filter(c => c.unreadCount > 0);
    } else if (selectedTab === 'archived') {
      filtered = filtered.filter(c => c.isArchived);
    } else {
      filtered = filtered.filter(c => !c.isArchived);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const conversationName = c.name?.toLowerCase() || '';
        const participantNames = c.participants.map(p => p.name.toLowerCase()).join(' ');
        const lastMessageContent = c.lastMessage?.content.toLowerCase() || '';

        return conversationName.includes(query) ||
               participantNames.includes(query) ||
               lastMessageContent.includes(query);
      });
    }

    // Sort by last message
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const aTime = a.lastMessage?.timestamp || a.createdAt;
      const bTime = b.lastMessage?.timestamp || b.createdAt;
      return bTime.getTime() - aTime.getTime();
    });
  }, [conversations, selectedTab, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    const activeConversations = conversations.filter(c =>
      c.lastMessage && new Date().getTime() - c.lastMessage.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length;

    return { totalUnread, activeConversations };
  }, [conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() && attachedFiles.length === 0) return;
    if (!selectedConversation) return;

    try {
      await onSendMessage(selectedConversation, messageInput, attachedFiles);
      setMessageInput('');
      setAttachedFiles([]);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleCreateConversation = async () => {
    if (selectedParticipants.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    try {
      const type = selectedParticipants.length === 1 ? 'direct' : 'group';
      const name = type === 'group' ? groupName : undefined;
      const conversationId = await onCreateConversation(selectedParticipants, name, type);

      setSelectedConversation(conversationId);
      setNewChatDialogOpen(false);
      setSelectedParticipants([]);
      setGroupName('');
      toast.success('Conversation created');
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
      return otherParticipant?.name || 'Unknown';
    }
    return conversation.participants
      .filter(p => p.id !== currentUser.id)
      .map(p => p.name.split(' ')[0])
      .join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
      return {
        image: otherParticipant?.profileImageUrl,
        fallback: otherParticipant?.name.split(' ').map(n => n[0]).join('') || '?',
      };
    }
    return {
      image: undefined,
      fallback: conversation.name?.[0] || 'G',
    };
  };

  const formatMessageTime = (timestamp: Date) => {
    if (isToday(timestamp)) return format(timestamp, 'h:mm a');
    if (isYesterday(timestamp)) return 'Yesterday';
    return format(timestamp, 'MMM dd');
  };

  const formatTypingIndicator = (participants: User[]) => {
    const typing = participants.filter(p => p.id !== currentUser.id);
    if (typing.length === 0) return '';
    if (typing.length === 1) return `${typing[0].name} is typing...`;
    if (typing.length === 2) return `${typing[0].name} and ${typing[1].name} are typing...`;
    return `${typing.length} people are typing...`;
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Messages</CardTitle>
            <Button size="sm" onClick={() => setNewChatDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            {stats.totalUnread > 0 && (
              <Badge variant="destructive">{stats.totalUnread}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="grid grid-cols-3 w-full rounded-none">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {stats.totalUnread > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1">
                    {stats.totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-1">
                {filteredConversations.map(conversation => {
                  const avatar = getConversationAvatar(conversation);
                  const isSelected = selectedConversation === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
                        isSelected ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={avatar.image} />
                        <AvatarFallback>{avatar.fallback}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">
                            {getConversationName(conversation)}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessage &&
                              formatMessageTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                          <div className="flex items-center gap-1">
                            {conversation.isPinned && (
                              <Star className="h-3 w-3 fill-current" />
                            )}
                            {conversation.isMuted && (
                              <BellOff className="h-3 w-3" />
                            )}
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 px-1.5">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chat Area */}
      {currentConversation ? (
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={getConversationAvatar(currentConversation).image} />
                  <AvatarFallback>
                    {getConversationAvatar(currentConversation).fallback}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{getConversationName(currentConversation)}</h3>
                  <p className="text-xs text-muted-foreground">
                    {currentConversation.type === 'group' &&
                      `${currentConversation.participants.length} participants`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      View Participants
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell className="h-4 w-4 mr-2" />
                      Mute Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {currentMessages.map((message, index) => {
                  const isOwn = message.senderId === currentUser.id;
                  const sender = currentConversation.participants.find(p => p.id === message.senderId);
                  const showAvatar = !isOwn && (
                    index === 0 ||
                    currentMessages[index - 1]?.senderId !== message.senderId
                  );

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sender?.profileImageUrl} />
                          <AvatarFallback>
                            {sender?.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isOwn && !showAvatar && <div className="w-8" />}

                      <div className={cn("max-w-[70%]", isOwn && "flex flex-col items-end")}>
                        {!isOwn && showAvatar && (
                          <p className="text-xs text-muted-foreground mb-1">{sender?.name}</p>
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2",
                            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map(attachment => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>{attachment.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {format(message.timestamp, 'h:mm a')}
                          </span>
                          {isOwn && (
                            <>
                              {message.status === 'read' && (
                                <CheckCheck className="h-3 w-3 text-blue-600" />
                              )}
                              {message.status === 'delivered' && (
                                <CheckCheck className="h-3 w-3 text-muted-foreground" />
                              )}
                              {message.status === 'sent' && (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )}
                              {message.status === 'sending' && (
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-4">
            <div className="flex-1 space-y-2">
              {attachedFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="text-xs">{file.name}</span>
                      <button onClick={() => removeAttachment(index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  rows={1}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Conversation Selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a conversation from the list or start a new chat
            </p>
            <Button onClick={() => setNewChatDialogOpen(true)}>
              Start New Conversation
            </Button>
          </div>
        </Card>
      )}

      {/* New Chat Dialog */}
      <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Select participants to start a new chat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search Users</Label>
              <Input
                placeholder="Search by name or email..."
                className="mt-2"
              />
            </div>

            {selectedParticipants.length > 1 && (
              <div>
                <Label>Group Name (Optional)</Label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label>Select Participants</Label>
              <ScrollArea className="h-64 border rounded-lg mt-2">
                <div className="p-2 space-y-1">
                  {users
                    .filter(u => u.id !== currentUser.id)
                    .map(user => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg"
                      >
                        <Checkbox
                          checked={selectedParticipants.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedParticipants(prev => [...prev, user.id]);
                            } else {
                              setSelectedParticipants(prev =>
                                prev.filter(id => id !== user.id)
                              );
                            }
                          }}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImageUrl} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>

            {selectedParticipants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedParticipants.map(id => {
                  const user = users.find(u => u.id === id);
                  return (
                    <Badge key={id} variant="secondary">
                      {user?.name}
                      <button
                        onClick={() => setSelectedParticipants(prev =>
                          prev.filter(p => p !== id)
                        )}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation}>
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}