'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Send, 
  Plus,
  Reply,
  Search,
  Filter,
  Paperclip,
  Archive,
  MoreVertical,
  Clock,
  AlertCircle,
  Scale,
  FileText
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { MessageType } from '@prisma/client'

interface MessageCenterProps {
  departmentId: string
  departmentName: string
  userRole: string
}

interface DepartmentMessage {
  id: string
  subject?: string
  content: string
  messageType: MessageType
  isRead: boolean
  isInternal: boolean
  createdAt: string
  fromUser: {
    id: string
    name: string
    email: string
    role: string
  }
  department: {
    id: string
    name: string
    code: string
  }
  case?: {
    id: string
    caseNumber: string
    title: string
  }
  request?: {
    id: string
    matterNumber: string
    title: string
  }
  replies: DepartmentMessage[]
  attachments: {
    id: string
    name: string
    fileName: string
    fileSize: number
  }[]
  _count: {
    replies: number
    attachments: number
  }
}

interface NewMessageData {
  subject: string
  content: string
  messageType: MessageType
  caseId?: string
  requestId?: string
  parentId?: string
}

const MESSAGE_TYPE_ICONS = {
  [MessageType.GENERAL]: <MessageCircle className="h-4 w-4" />,
  [MessageType.QUESTION]: <AlertCircle className="h-4 w-4" />,
  [MessageType.UPDATE]: <Clock className="h-4 w-4" />,
  [MessageType.URGENT]: <AlertCircle className="h-4 w-4 text-red-500" />,
  [MessageType.DOCUMENT_REQUEST]: <FileText className="h-4 w-4" />,
  [MessageType.MEETING_REQUEST]: <Calendar className="h-4 w-4" />,
  [MessageType.CASE_UPDATE]: <Scale className="h-4 w-4" />
}

export function MessageCenter({ departmentId, departmentName, userRole }: MessageCenterProps) {
  const [messages, setMessages] = useState<DepartmentMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<DepartmentMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MessageType | 'ALL'>('ALL')
  const [activeTab, setActiveTab] = useState('inbox')
  const [newMessage, setNewMessage] = useState<NewMessageData>({
    subject: '',
    content: '',
    messageType: MessageType.GENERAL
  })
  const [replyContent, setReplyContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchMessages()
  }, [departmentId, activeTab])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const isArchived = activeTab === 'archived'
      const response = await fetch(`/api/messages?departmentId=${departmentId}&isArchived=${isArchived}&limit=50`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Message content is required',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSending(true)
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMessage,
          departmentId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      toast({
        title: 'Success',
        description: 'Message sent successfully'
      })

      setComposeOpen(false)
      setNewMessage({
        subject: '',
        content: '',
        messageType: MessageType.GENERAL
      })
      
      await fetchMessages()

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const sendReply = async () => {
    if (!replyContent.trim() || !selectedMessage) {
      return
    }

    try {
      setIsSending(true)
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          messageType: MessageType.GENERAL,
          departmentId,
          parentId: selectedMessage.id,
          caseId: selectedMessage.case?.id,
          requestId: selectedMessage.request?.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send reply')
      }

      toast({
        title: 'Success',
        description: 'Reply sent successfully'
      })

      setReplyOpen(false)
      setReplyContent('')
      
      await fetchMessages()
      // Refresh selected message to show new reply
      if (selectedMessage) {
        const updatedMessage = messages.find(m => m.id === selectedMessage.id)
        if (updatedMessage) {
          setSelectedMessage(updatedMessage)
        }
      }

    } catch (error) {
      console.error('Error sending reply:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reply',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST'
      })
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ))
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchQuery || 
      (message.subject && message.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.fromUser.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'ALL' || message.messageType === typeFilter

    return matchesSearch && matchesType
  })

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500'
      case 'ATTORNEY': return 'bg-blue-500'
      case 'PARALEGAL': return 'bg-purple-500'
      case 'CLIENT_DEPT': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Center</h1>
          <p className="text-muted-foreground">
            Secure communication with the Rochester Law Department
          </p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>
                Send a secure message to the Law Department
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Message subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageType">Message Type</Label>
                  <Select 
                    value={newMessage.messageType} 
                    onValueChange={(value) => setNewMessage(prev => ({ ...prev, messageType: value as MessageType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MessageType).map(type => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {MESSAGE_TYPE_ICONS[type]}
                            {type.replace('_', ' ').toLowerCase()}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Type your message here..."
                  rows={8}
                />
                <div className="text-sm text-muted-foreground text-right">
                  {newMessage.content.length}/5000 characters
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendMessage} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Messages</CardTitle>
                <Badge variant="secondary">{filteredMessages.length}</Badge>
              </div>
              
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {Object.values(MessageType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="inbox">Inbox</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="archived">Archive</TabsTrigger>
                </TabsList>

                <div className="max-h-[600px] overflow-y-auto">
                  {filteredMessages.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages found</p>
                      <p className="text-sm">Start a conversation with the Law Department</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredMessages.map(message => (
                        <div
                          key={message.id}
                          className={`p-4 cursor-pointer hover:bg-muted transition-colors border-b ${
                            selectedMessage?.id === message.id ? 'bg-muted' : ''
                          } ${!message.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                          onClick={() => {
                            setSelectedMessage(message)
                            if (!message.isRead) {
                              markAsRead(message.id)
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className={getRoleColor(message.fromUser.role)}>
                                {getUserInitials(message.fromUser.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm truncate">{message.fromUser.name}</p>
                                <div className="flex items-center gap-1">
                                  {MESSAGE_TYPE_ICONS[message.messageType]}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>

                              <p className="font-medium text-sm truncate">
                                {message.subject || 'No subject'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {message.content}
                              </p>

                              <div className="flex items-center gap-2 mt-2">
                                {message.case && (
                                  <Badge variant="outline" className="text-xs">
                                    Case: {message.case.caseNumber}
                                  </Badge>
                                )}
                                {message.request && (
                                  <Badge variant="outline" className="text-xs">
                                    Request: {message.request.matterNumber}
                                  </Badge>
                                )}
                                {message._count.replies > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {message._count.replies} replies
                                  </Badge>
                                )}
                                {message._count.attachments > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Paperclip className="h-3 w-3 mr-1" />
                                    {message._count.attachments}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={getRoleColor(selectedMessage.fromUser.role)}>
                        {getUserInitials(selectedMessage.fromUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{selectedMessage.fromUser.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {selectedMessage.fromUser.role.replace('_', ' ')}
                        </Badge>
                        {MESSAGE_TYPE_ICONS[selectedMessage.messageType]}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedMessage.fromUser.email} • {selectedMessage.department.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reply to Message</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="p-3 border rounded bg-muted/50">
                            <p className="text-sm font-medium">Replying to:</p>
                            <p className="text-sm">{selectedMessage.subject || 'No subject'}</p>
                            <p className="text-xs text-muted-foreground">
                              From {selectedMessage.fromUser.name}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="reply-content">Your Reply</Label>
                            <Textarea
                              id="reply-content"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Type your reply here..."
                              rows={6}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setReplyOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={sendReply} disabled={isSending || !replyContent.trim()}>
                            {isSending ? 'Sending...' : 'Send Reply'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {selectedMessage.subject && (
                  <div className="pt-2 border-t">
                    <h2 className="text-lg font-medium">{selectedMessage.subject}</h2>
                  </div>
                )}

                {(selectedMessage.case || selectedMessage.request) && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {selectedMessage.case && (
                      <Badge variant="outline">
                        <Scale className="h-3 w-3 mr-1" />
                        Case: {selectedMessage.case.caseNumber}
                      </Badge>
                    )}
                    {selectedMessage.request && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Request: {selectedMessage.request.matterNumber}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  {/* Original Message */}
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
                  </div>

                  {/* Attachments */}
                  {selectedMessage.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Attachments</h4>
                      <div className="space-y-2">
                        {selectedMessage.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{attachment.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(attachment.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {selectedMessage.replies.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Replies ({selectedMessage.replies.length})</h4>
                      {selectedMessage.replies.map(reply => (
                        <div key={reply.id} className="border-l-4 border-muted pl-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className={getRoleColor(reply.fromUser.role)}>
                                {getUserInitials(reply.fromUser.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{reply.fromUser.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{reply.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a message to view</p>
                  <p className="text-sm">Choose a message from the list to read and reply</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}