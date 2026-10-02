import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Info,
  Check
} from 'lucide-react';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../store/notificationApi';

/**
 * NotificationBell & NotificationCenter (Step 3.4.5, NOT-FR-02)
 * Redesigned to strictly match Amazon/ShopSphere design tokens and guidelines:
 * - Lucide icons only (no emojis, no custom SVG)
 * - Rectangular geometry (2-4px radius)
 * - Flat utilitarian appearance with official color tokens
 * - No gradients, no glassmorphism, no pulsing animations
 */
export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { data, isLoading } = useGetNotificationsQuery(
    filterUnread ? { unreadOnly: 'true' } : undefined,
    { pollingInterval: 30000 }
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = data?.data || [];
  const unreadCount = data?.meta?.unreadCount || 0;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch (err) {
        // Silently continue
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order_confirmed':
        return <CheckCircle2 size={16} className="text-[#007600]" strokeWidth={1.75} />;
      case 'order_shipped':
        return <Truck size={16} className="text-[#007185]" strokeWidth={1.75} />;
      case 'order_delivered':
        return <Package size={16} className="text-[#007600]" strokeWidth={1.75} />;
      case 'order_cancelled':
        return <XCircle size={16} className="text-[#B12704]" strokeWidth={1.75} />;
      default:
        return <Info size={16} className="text-[#565959]" strokeWidth={1.75} />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-[2px] border border-transparent hover:border-white text-white focus:outline-none focus:ring-1 focus:ring-[#007185] transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell size={20} strokeWidth={1.75} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#FFA41C] text-[#0F1111] text-[11px] font-bold rounded-full leading-none border border-[#131921]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-80 sm:w-96 bg-white border border-[#D5D9D9] rounded-[4px] shadow-lg z-50 overflow-hidden"
          role="region"
          aria-label="Notification center"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-[#F0F2F2] border-b border-[#D5D9D9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[#0F1111]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-[#FFA41C]/25 text-[#0F1111] border border-[#FFA41C]/50 rounded-[2px]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#D5D9D9] bg-white text-[13px]">
            <button
              type="button"
              onClick={() => setFilterUnread(false)}
              className={`flex-1 py-2 text-center text-[13px] font-medium transition-colors ${
                !filterUnread
                  ? 'text-[#0F1111] font-semibold border-b-2 border-[#E77600] bg-white'
                  : 'text-[#565959] hover:text-[#0F1111] bg-[#FAFAFA]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterUnread(true)}
              className={`flex-1 py-2 text-center text-[13px] font-medium transition-colors ${
                filterUnread
                  ? 'text-[#0F1111] font-semibold border-b-2 border-[#E77600] bg-white'
                  : 'text-[#565959] hover:text-[#0F1111] bg-[#FAFAFA]'
              }`}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#E7E7E7]">
            {isLoading && (
              <div className="py-8 text-center text-[13px] text-[#565959]">
                Loading notifications...
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="py-10 text-center px-4">
                <div className="w-10 h-10 rounded-[4px] bg-[#F0F2F2] border border-[#D5D9D9] mx-auto flex items-center justify-center text-[#565959] mb-2">
                  <Check size={18} strokeWidth={2} />
                </div>
                <p className="text-[13px] font-medium text-[#0F1111]">
                  You have no notifications
                </p>
                <p className="text-[12px] text-[#565959] mt-0.5">
                  We will notify you about your orders and account updates here.
                </p>
              </div>
            )}

            {!isLoading &&
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    notif.isRead
                      ? 'bg-white hover:bg-[#F7FAFA]'
                      : 'bg-[#F0F7F9] hover:bg-[#E5F1F4] border-l-[3px] border-l-[#007185]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-[2px] bg-[#F0F2F2] border border-[#D5D9D9] flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-[13px] truncate ${
                          notif.isRead
                            ? 'font-medium text-[#0F1111]'
                            : 'font-semibold text-[#0F1111]'
                        }`}
                      >
                        {notif.title}
                      </span>
                      <span className="text-[11px] text-[#767676] shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#565959] line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
