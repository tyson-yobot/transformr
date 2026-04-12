// =============================================================================
// TRANSFORMR -- Skill & Knowledge Tracker
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Chip } from '@components/ui/Chip';
import { Slider } from '@components/ui/Slider';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { formatPercentage } from '@utils/formatters';
import type { Skill, Book, Course } from '@app-types/database';

type ActiveTab = 'skills' | 'books' | 'courses';

const BOOK_STATUSES: { key: NonNullable<Book['status']>; label: string }[] = [
  { key: 'want_to_read', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'completed', label: 'Completed' },
];

export default function SkillsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [activeTab, setActiveTab] = useState<ActiveTab>('skills');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Add skill state
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState(1);
  const [newSkillTarget, setNewSkillTarget] = useState(10);

  // Add book state
  const [showBookModal, setShowBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookPages, setNewBookPages] = useState('');

  // Add course state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePlatform, setNewCoursePlatform] = useState('');
  const [newCourseUrl, setNewCourseUrl] = useState('');

  const [bookFilter, setBookFilter] = useState<Book['status'] | null>(null);

  const filteredBooks = useMemo(
    () => (bookFilter ? books.filter((b) => b.status === bookFilter) : books),
    [books, bookFilter],
  );

  const handleAddSkill = useCallback(() => {
    if (!newSkillName.trim()) return;
    const skill: Skill = {
      id: Date.now().toString(),
      name: newSkillName.trim(),
      proficiency: newSkillProficiency,
      target_proficiency: newSkillTarget,
      hours_practiced: 0,
    };
    setSkills((prev) => [...prev, skill]);
    setShowSkillModal(false);
    setNewSkillName('');
    setNewSkillProficiency(1);
    hapticSuccess();
  }, [newSkillName, newSkillProficiency, newSkillTarget]);

  const handleAddBook = useCallback(() => {
    if (!newBookTitle.trim()) return;
    const book: Book = {
      id: Date.now().toString(),
      title: newBookTitle.trim(),
      author: newBookAuthor.trim() || undefined,
      pages_total: newBookPages ? parseInt(newBookPages, 10) : undefined,
      pages_read: 0,
      status: 'want_to_read',
    };
    setBooks((prev) => [...prev, book]);
    setShowBookModal(false);
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookPages('');
    hapticSuccess();
  }, [newBookTitle, newBookAuthor, newBookPages]);

  const handleAddCourse = useCallback(() => {
    if (!newCourseTitle.trim()) return;
    const course: Course = {
      id: Date.now().toString(),
      title: newCourseTitle.trim(),
      platform: newCoursePlatform.trim() || undefined,
      url: newCourseUrl.trim() || undefined,
      progress_percent: 0,
      status: 'planned',
    };
    setCourses((prev) => [...prev, course]);
    setShowCourseModal(false);
    setNewCourseTitle('');
    setNewCoursePlatform('');
    setNewCourseUrl('');
    hapticSuccess();
  }, [newCourseTitle, newCoursePlatform, newCourseUrl]);

  const renderSkillsTab = () => (
    <View style={{ gap: spacing.md }}>
      {skills.map((skill, index) => {
        const progress =
          skill.target_proficiency && skill.target_proficiency > 0
            ? (skill.proficiency ?? 0) / skill.target_proficiency
            : 0;
        return (
          <Animated.View key={skill.id} entering={FadeInDown.delay(index * 50)}>
            <Card>
              <View style={styles.skillRow}>
                <Text style={[typography.bodyBold, { color: colors.text.primary, flex: 1 }]}>
                  {skill.name}
                </Text>
                <Text style={[typography.monoBody, { color: colors.accent.primary }]}>
                  {skill.proficiency}/{skill.target_proficiency}
                </Text>
              </View>
              <ProgressBar
                progress={progress}
                color={colors.accent.primary}
                style={{ marginTop: spacing.sm }}
              />
              {skill.hours_practiced != null && skill.hours_practiced > 0 && (
                <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
                  <Text style={typography.monoBody}>{skill.hours_practiced}h</Text> practiced
                </Text>
              )}
            </Card>
          </Animated.View>
        );
      })}
      {skills.length === 0 && (
        <Card>
          <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
            No skills tracked yet. Add your first skill!
          </Text>
        </Card>
      )}
      <Button title="Add Skill" onPress={() => setShowSkillModal(true)} fullWidth />
    </View>
  );

  const renderBooksTab = () => (
    <View style={{ gap: spacing.md }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}
      >
        <Chip label="All" selected={bookFilter === null} onPress={() => setBookFilter(null)} />
        {BOOK_STATUSES.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            selected={bookFilter === s.key}
            onPress={() => setBookFilter(bookFilter === s.key ? null : s.key)}
          />
        ))}
      </ScrollView>

      {filteredBooks.map((book, index) => {
        const progress =
          book.pages_total && book.pages_total > 0
            ? (book.pages_read ?? 0) / book.pages_total
            : 0;
        return (
          <Animated.View key={book.id} entering={FadeInDown.delay(index * 50)}>
            <Card>
              <View style={styles.skillRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {book.title}
                  </Text>
                  {book.author && (
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      {book.author}
                    </Text>
                  )}
                </View>
                <Badge
                  label={
                    book.status === 'completed'
                      ? 'Done'
                      : book.status === 'reading'
                        ? 'Reading'
                        : 'To Read'
                  }
                  variant={
                    book.status === 'completed'
                      ? 'success'
                      : book.status === 'reading'
                        ? 'info'
                        : 'default'
                  }
                  size="sm"
                />
              </View>
              {book.pages_total && book.pages_total > 0 && (
                <ProgressBar
                  progress={progress}
                  label={`${book.pages_read ?? 0} / ${book.pages_total} pages`}
                  showPercentage
                  style={{ marginTop: spacing.sm }}
                />
              )}
            </Card>
          </Animated.View>
        );
      })}
      {filteredBooks.length === 0 && (
        <Card>
          <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
            No books yet. Start building your reading list!
          </Text>
        </Card>
      )}
      <Button title="Add Book" onPress={() => setShowBookModal(true)} fullWidth />
    </View>
  );

  const renderCoursesTab = () => (
    <View style={{ gap: spacing.md }}>
      {courses.map((course, index) => (
        <Animated.View key={course.id} entering={FadeInDown.delay(index * 50)}>
          <Card>
            <View style={styles.skillRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {course.title}
                </Text>
                {course.platform && (
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {course.platform}
                  </Text>
                )}
              </View>
              <Badge
                label={
                  course.status === 'completed'
                    ? 'Done'
                    : course.status === 'in_progress'
                      ? 'In Progress'
                      : 'Planned'
                }
                variant={
                  course.status === 'completed'
                    ? 'success'
                    : course.status === 'in_progress'
                      ? 'info'
                      : 'default'
                }
                size="sm"
              />
            </View>
            <ProgressBar
              progress={(course.progress_percent ?? 0) / 100}
              showPercentage
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </Animated.View>
      ))}
      {courses.length === 0 && (
        <Card>
          <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
            No courses yet. Start learning!
          </Text>
        </Card>
      )}
      <Button title="Add Course" onPress={() => setShowCourseModal(true)} fullWidth />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Switcher */}
        <View style={[styles.tabRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
          {(['skills', 'books', 'courses'] as ActiveTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => { hapticLight(); setActiveTab(tab); }}
              accessibilityLabel={`Switch to ${tab} tab`}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    activeTab === tab
                      ? colors.accent.primary
                      : colors.background.secondary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                  flex: 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: activeTab === tab ? '#FFFFFF' : colors.text.secondary,
                    textAlign: 'center',
                  },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'skills' && renderSkillsTab()}
        {activeTab === 'books' && renderBooksTab()}
        {activeTab === 'courses' && renderCoursesTab()}

        {/* AI Recommendations */}
        <Card
          style={{
            marginTop: spacing.xl,
            borderWidth: 1,
            borderColor: colors.accent.primary,
          }}
        >
          <View style={styles.aiRow}>
            <Badge label="AI" variant="info" size="sm" />
            <Text style={[typography.bodyBold, { color: colors.accent.primary, marginLeft: spacing.sm }]}>
              Recommendations
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            Based on your goals, consider learning about financial modeling, advanced TypeScript patterns, or leadership principles.
          </Text>
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Skill Modal */}
      <Modal visible={showSkillModal} onDismiss={() => setShowSkillModal(false)} title="Add Skill">
        <Input label="Skill Name" value={newSkillName} onChangeText={setNewSkillName} placeholder="e.g. TypeScript" />
        <Slider
          value={newSkillProficiency}
          onValueChange={setNewSkillProficiency}
          min={1}
          max={10}
          step={1}
          label="Current Proficiency"
          style={{ marginTop: spacing.lg }}
        />
        <Slider
          value={newSkillTarget}
          onValueChange={setNewSkillTarget}
          min={1}
          max={10}
          step={1}
          label="Target Proficiency"
          style={{ marginTop: spacing.lg }}
        />
        <Button title="Add Skill" onPress={handleAddSkill} fullWidth disabled={!newSkillName.trim()} style={{ marginTop: spacing.xl }} />
      </Modal>

      {/* Add Book Modal */}
      <Modal visible={showBookModal} onDismiss={() => setShowBookModal(false)} title="Add Book">
        <Input label="Title" value={newBookTitle} onChangeText={setNewBookTitle} placeholder="Book title" />
        <Input label="Author" value={newBookAuthor} onChangeText={setNewBookAuthor} placeholder="Author name" containerStyle={{ marginTop: spacing.md }} />
        <Input label="Total Pages" value={newBookPages} onChangeText={setNewBookPages} placeholder="300" keyboardType="number-pad" containerStyle={{ marginTop: spacing.md }} />
        <Button title="Add Book" onPress={handleAddBook} fullWidth disabled={!newBookTitle.trim()} style={{ marginTop: spacing.xl }} />
      </Modal>

      {/* Add Course Modal */}
      <Modal visible={showCourseModal} onDismiss={() => setShowCourseModal(false)} title="Add Course">
        <Input label="Title" value={newCourseTitle} onChangeText={setNewCourseTitle} placeholder="Course title" />
        <Input label="Platform" value={newCoursePlatform} onChangeText={setNewCoursePlatform} placeholder="Udemy, Coursera..." containerStyle={{ marginTop: spacing.md }} />
        <Input label="URL (optional)" value={newCourseUrl} onChangeText={setNewCourseUrl} placeholder="https://..." containerStyle={{ marginTop: spacing.md }} />
        <Button title="Add Course" onPress={handleAddCourse} fullWidth disabled={!newCourseTitle.trim()} style={{ marginTop: spacing.xl }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  tabRow: { flexDirection: 'row' },
  tab: { alignItems: 'center' },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiRow: { flexDirection: 'row', alignItems: 'center' },
});
