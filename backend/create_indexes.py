#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库索引创建脚本
为notes表添加必要的索引以优化查询性能
"""

import sqlite3
import os

def create_indexes():
    """创建数据库索引"""
    db_path = 'notes.db'
    
    if not os.path.exists(db_path):
        print(f"数据库文件 {db_path} 不存在")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 创建索引SQL语句
        indexes = [
            # 标题索引 - 用于按标题搜索和排序
            "CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);",
            
            # 更新时间索引 - 用于按时间排序（最常用）
            "CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);",
            
            # 创建时间索引 - 用于按创建时间排序
            "CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);",
            
            # 标题和更新时间复合索引 - 用于复合查询优化
            "CREATE INDEX IF NOT EXISTS idx_notes_title_updated ON notes(title, updated_at DESC);",
            
            # 内容全文搜索索引（SQLite FTS虚拟表）
            "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, content, content='notes', content_rowid='id');",
            
            # 触发器：当notes表插入时同步到FTS表
            """CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
                INSERT INTO notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
            END;""",
            
            # 触发器：当notes表更新时同步到FTS表
            """CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
                UPDATE notes_fts SET title = new.title, content = new.content WHERE rowid = new.id;
            END;""",
            
            # 触发器：当notes表删除时同步到FTS表
            """CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
                DELETE FROM notes_fts WHERE rowid = old.id;
            END;"""
        ]
        
        print("开始创建数据库索引...")
        
        for i, sql in enumerate(indexes, 1):
            print(f"[{i}/{len(indexes)}] 执行: {sql.split()[0:5]}", end=" ")
            cursor.execute(sql)
            print("✓")
        
        # 如果FTS表为空，初始化数据
        cursor.execute("SELECT COUNT(*) FROM notes_fts")
        fts_count = cursor.fetchone()[0]
        
        if fts_count == 0:
            print("初始化全文搜索索引数据...")
            cursor.execute("""
                INSERT INTO notes_fts(rowid, title, content)
                SELECT id, title, content FROM notes
            """)
            print("✓ 全文搜索索引数据初始化完成")
        
        conn.commit()
        conn.close()
        
        print("\n✅ 所有索引创建完成！")
        print("\n已创建的索引：")
        print("- idx_notes_title: 标题索引")
        print("- idx_notes_updated_at: 更新时间索引")
        print("- idx_notes_created_at: 创建时间索引")
        print("- idx_notes_title_updated: 标题+时间复合索引")
        print("- notes_fts: 全文搜索虚拟表")
        print("- 相关触发器: 自动同步FTS数据")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ 数据库错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

def show_database_info():
    """显示数据库信息"""
    try:
        conn = sqlite3.connect('notes.db')
        cursor = conn.cursor()
        
        # 显示表信息
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("\n📊 数据库表:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # 显示索引信息
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index';")
        indexes = cursor.fetchall()
        print("\n📈 数据库索引:")
        for index in indexes:
            print(f"  - {index[0]}")
        
        # 显示数据统计
        cursor.execute("SELECT COUNT(*) FROM notes")
        note_count = cursor.fetchone()[0]
        print(f"\n📝 笔记数量: {note_count}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 获取数据库信息失败: {e}")

if __name__ == '__main__':
    print("=== AI记事本数据库索引优化工具 ===")
    print()
    
    if create_indexes():
        show_database_info()
    else:
        print("❌ 索引创建失败")